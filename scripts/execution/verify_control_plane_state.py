from __future__ import annotations

import argparse
import hashlib
import json
import os
import sqlite3
import subprocess
import sys
from pathlib import Path
from typing import Any


MAX_UNGOVERNED_REMOTE_COMMITS = 8
GOVERNANCE_TRAILERS = (
    "Execution-Program",
    "Execution-Node",
    "Checkpoint-ID",
    "Evidence-SHA256",
)


def git(root: Path, *args: str) -> str:
    return subprocess.run(
        ["git", *args],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


def trailers(message: str) -> dict[str, str]:
    parsed = subprocess.run(
        ["git", "interpret-trailers", "--parse"],
        input=message,
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    result: dict[str, str] = {}
    for line in parsed.splitlines():
        name, separator, value = line.partition(":")
        if separator and name and value.strip():
            result[name] = "" if name in result else value.strip()
    return result


def runtime_database() -> Path:
    override = os.environ.get("SKY_DEV_RUNTIME")
    if override:
        return Path(override).expanduser() / "graphify.db"
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data) / "SkyDevControlPlane" / "graphify.db"
    return Path.home() / ".local" / "share" / "sky-dev-control-plane" / "graphify.db"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalized(path: str | Path) -> str:
    return os.path.normcase(str(Path(path).resolve()))


def evidence_contains(evidence: Any, expected_sha: str) -> bool:
    if not isinstance(evidence, list):
        return False
    return any(
        isinstance(item, dict)
        and expected_sha in {
            str(item.get("sha256") or ""),
            str(item.get("evidenceSha256") or ""),
        }
        for item in evidence
    )


def evidence_contains_remote_reconciliation(
    root: Path,
    evidence: Any,
    reconciliation: dict[str, Any],
    expected_sha: str,
    expected_ref: str,
) -> bool:
    if (
        not expected_sha
        or not evidence_contains(evidence, expected_sha)
        or len(expected_sha) != 64
    ):
        return False
    receipt_path = (
        root / ".agents" / "execution" / "evidence" / f"{expected_sha}.json"
    )
    if not receipt_path.is_file() or sha256_file(receipt_path) != expected_sha:
        return False
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    recorded = receipt.get("remoteStartReconciliation")
    return (
        isinstance(recorded, dict)
        and recorded.get("commitSha") == reconciliation.get("commitSha")
        and recorded.get("fromGovernedHead")
        == reconciliation.get("fromGovernedHead")
        and recorded.get("ungovernedCommitCount")
        == reconciliation.get("ungovernedCommitCount")
        and recorded.get("pushedRef") == expected_ref
    )


def resolve_remote_start_handoff(
    root: Path,
    connection: sqlite3.Connection,
    program_id: str,
    remote_start: str,
    pushed_head: str,
) -> tuple[sqlite3.Row | None, dict[str, Any] | None, str | None]:
    ancestor = subprocess.run(
        ["git", "merge-base", "--is-ancestor", remote_start, pushed_head],
        cwd=root,
        check=False,
        capture_output=True,
        text=True,
    )
    if ancestor.returncode != 0:
        return None, None, "remote start is not an ancestor of the pushed HEAD"

    history = [
        commit
        for commit in git(
            root,
            "rev-list",
            "--first-parent",
            f"--max-count={MAX_UNGOVERNED_REMOTE_COMMITS + 1}",
            remote_start,
        ).splitlines()
        if commit
    ]
    for distance, candidate in enumerate(history):
        handoff = connection.execute(
            """
            SELECT
              h.next_node,
              h.next_stage,
              h.checkpoint_id,
              h.node_id,
              h.stage_id,
              h.head_sha,
              e.tree_sha,
              e.payload_json
            FROM lifecycle_handoffs AS h
            JOIN lifecycle_events AS e
              ON e.program_id = h.program_id
             AND e.checkpoint_id = h.checkpoint_id
             AND e.event_type = 'checkpoint_completed'
             AND e.node_id = h.node_id
             AND e.stage_id = h.stage_id
             AND e.head_sha = h.head_sha
            WHERE h.program_id = ? AND h.head_sha = ?
            ORDER BY e.event_sequence DESC, h.created_at DESC, h.handoff_id DESC
            LIMIT 1
            """,
            (program_id, candidate),
        ).fetchone()
        values = trailers(git(root, "show", "-s", "--format=%B", candidate))
        if handoff is None:
            if any(values.get(name) for name in GOVERNANCE_TRAILERS):
                return (
                    None,
                    None,
                    "remote history contains a governed commit without an exact handoff",
                )
            continue
        if (
            any(not values.get(name) for name in GOVERNANCE_TRAILERS)
            or values.get("Execution-Program") != program_id
            or values.get("Execution-Node") != handoff["node_id"]
            or values.get("Checkpoint-ID") != handoff["checkpoint_id"]
        ):
            return None, None, "remote ancestor handoff has invalid commit authority"
        candidate_tree = git(root, "rev-parse", f"{candidate}^{{tree}}")
        if handoff["tree_sha"] != candidate_tree:
            return None, None, "remote ancestor handoff has an invalid commit tree"
        completion_payload = json.loads(str(handoff["payload_json"]))
        if not evidence_contains(
            completion_payload.get("evidence"),
            str(values["Evidence-SHA256"]),
        ):
            return None, None, "remote ancestor handoff lacks exact evidence authority"
        if distance == 0:
            return handoff, None, None
        return (
            handoff,
            {
                "commitSha": remote_start,
                "fromGovernedHead": candidate,
                "ungovernedCommitCount": distance,
            },
            None,
        )

    return (
        None,
        None,
        "remote start has no bounded governed ancestor handoff",
    )


def outgoing_commits(
    root: Path, head: str, baseline: str, push_updates: str | None
) -> tuple[str, list[str]]:
    start = baseline
    if push_updates:
        rows = [line.split() for line in push_updates.splitlines() if line.strip()]
        matching = [row for row in rows if len(row) == 4 and row[1] == head]
        if len(matching) != 1:
            raise ValueError("expected exactly one outgoing update for the checked-out HEAD")
        remote_sha = matching[0][3]
        if remote_sha != "0" * 40:
            start = remote_sha
    output = git(root, "rev-list", "--reverse", f"{start}..{head}")
    return start, [commit for commit in output.splitlines() if commit]


def transition_error(
    connection: sqlite3.Connection,
    graph_id: str,
    node_id: str,
    started_stage: str,
    completed_stage: str,
    next_node: str,
    next_stage: str,
    checkpoint_sequence: int,
) -> str | None:
    start = connection.execute(
        """
        SELECT ordinal
        FROM execution_stages
        WHERE graph_id = ? AND node_id = ? AND stage_id = ?
        """,
        (graph_id, node_id, started_stage),
    ).fetchone()
    completed = connection.execute(
        """
        SELECT ordinal
        FROM execution_stages
        WHERE graph_id = ? AND node_id = ? AND stage_id = ?
        """,
        (graph_id, node_id, completed_stage),
    ).fetchone()
    if start is None or completed is None or completed["ordinal"] < start["ordinal"]:
        return "checkpoint stage span is invalid"
    path_stages = connection.execute(
        """
        SELECT stage_id
        FROM execution_stages
        WHERE graph_id = ? AND node_id = ? AND ordinal BETWEEN ? AND ?
        ORDER BY ordinal, stage_id
        """,
        (graph_id, node_id, start["ordinal"], completed["ordinal"]),
    ).fetchall()
    path_ids = [str(row["stage_id"]) for row in path_stages]
    if (
        not path_ids
        or path_ids[0] != started_stage
        or path_ids[-1] != completed_stage
    ):
        return "checkpoint stage span is not contiguous in the audited graph"
    for source, target in zip(path_ids, path_ids[1:]):
        edge = connection.execute(
            """
            SELECT 1
            FROM execution_edges
            WHERE graph_id = ? AND edge_type = 'stage_sequence'
              AND source_id = ? AND target_id = ? AND required = 1
            """,
            (graph_id, source, target),
        ).fetchone()
        if edge is None:
            return f"checkpoint stage span is missing required edge: {source} -> {target}"

    destination = connection.execute(
        """
        SELECT node_id, ordinal
        FROM execution_stages
        WHERE graph_id = ? AND stage_id = ?
        """,
        (graph_id, next_stage),
    ).fetchone()
    if destination is None or destination["node_id"] != next_node:
        return "handoff destination stage does not belong to its destination node"

    if next_node == node_id:
        edge = connection.execute(
            """
            SELECT 1
            FROM execution_edges
            WHERE graph_id = ? AND edge_type = 'stage_sequence'
              AND source_id = ? AND target_id = ? AND required = 1
            """,
            (graph_id, completed_stage, next_stage),
        ).fetchone()
        if edge is None:
            return "handoff does not follow a required stage-sequence edge"
        return None

    terminal = connection.execute(
        """
        SELECT stage_id
        FROM execution_stages
        WHERE graph_id = ? AND node_id = ?
        ORDER BY ordinal DESC, stage_id DESC
        LIMIT 1
        """,
        (graph_id, node_id),
    ).fetchone()
    if terminal is None or terminal["stage_id"] != completed_stage:
        return "cross-node handoff does not start at the source terminal stage"

    dependency_rows = connection.execute(
        """
        SELECT depends_on_node_id
        FROM execution_dependencies
        WHERE graph_id = ? AND node_id = ?
        ORDER BY dependency_order, depends_on_node_id
        """,
        (graph_id, next_node),
    ).fetchall()
    dependencies = [str(row["depends_on_node_id"]) for row in dependency_rows]
    for dependency in dependencies:
        if dependency == node_id:
            continue
        completed_dependency = connection.execute(
            """
            SELECT 1
            FROM lifecycle_events
            WHERE program_id = ? AND node_id = ?
              AND event_type = 'checkpoint_completed'
              AND event_sequence <= ?
            LIMIT 1
            """,
            (graph_id, dependency, checkpoint_sequence),
        ).fetchone()
        if completed_dependency is None:
            dependency_node = connection.execute(
                """
                SELECT status
                FROM execution_nodes
                WHERE graph_id = ? AND node_id = ?
                """,
                (graph_id, dependency),
            ).fetchone()
            historical_complete = (
                dependency_node is not None
                and str(dependency_node["status"])
                in {"complete", "completed", "historical_complete_do_not_replay"}
            )
            if not historical_complete:
                return f"handoff destination dependency is incomplete: {dependency}"

    first_stage = connection.execute(
        """
        SELECT stage_id
        FROM execution_stages
        WHERE graph_id = ? AND node_id = ?
        ORDER BY ordinal, stage_id
        LIMIT 1
        """,
        (graph_id, next_node),
    ).fetchone()
    if first_stage is None or first_stage["stage_id"] != next_stage:
        return "cross-node handoff must target the destination node's first stage"

    ranks = connection.execute(
        """
        SELECT node_id, sequential_rank
        FROM execution_nodes
        WHERE graph_id = ? AND node_id IN (?, ?)
        """,
        (graph_id, node_id, next_node),
    ).fetchall()
    rank_by_node = {
        str(row["node_id"]): row["sequential_rank"] for row in ranks
    }
    source_rank = rank_by_node.get(node_id)
    destination_rank = rank_by_node.get(next_node)
    if (
        not isinstance(source_rank, int)
        or not isinstance(destination_rank, int)
        or destination_rank != source_rank + 1
    ):
        return "cross-node handoff does not follow the next sequential rank"

    authority = connection.execute(
        "SELECT current_node FROM execution_graph_imports WHERE graph_id = ?",
        (graph_id,),
    ).fetchone()
    if authority is not None and authority["current_node"] == node_id:
        cursor_record = connection.execute(
            """
            SELECT raw_json
            FROM execution_records
            WHERE graph_id = ? AND record_type = 'execution_cursor'
            """,
            (graph_id,),
        ).fetchone()
        cursor = json.loads(cursor_record["raw_json"]) if cursor_record else {}
        if cursor.get("nextOnSuccess") and cursor["nextOnSuccess"] != next_node:
            return "handoff destination does not match cursor nextOnSuccess"
    return None


def verify(
    root: Path, db_path: Path, push_updates: str | None = None
) -> dict[str, Any]:
    errors: list[str] = []
    config = json.loads(
        (root / ".agents" / "governance" / "development-lifecycle.json").read_text(
            encoding="utf-8"
        )
    )
    head = git(root, "rev-parse", "HEAD")
    head_message = git(root, "show", "-s", "--format=%B", "HEAD")
    head_values = trailers(head_message)
    checkpoint_id = head_values.get("Checkpoint-ID", "")
    evidence_sha = head_values.get("Evidence-SHA256", "")

    if git(root, "status", "--porcelain=v1", "--untracked-files=all"):
        errors.append("worktree is not clean")
    if head_values.get("Execution-Program") != config.get("programId"):
        errors.append("HEAD is not bound to the configured execution program")
    if not checkpoint_id or not evidence_sha:
        errors.append("HEAD is missing checkpoint or evidence trailers")
    if not db_path.is_file():
        errors.append(f"control-plane database does not exist: {db_path}")
        return {"ok": False, "head": head, "database": str(db_path), "errors": errors}

    graph_path = root / "graphify-out" / "graph.json"
    code_graph_sha = ""
    if not graph_path.is_file():
        errors.append("graphify-out/graph.json is missing; bootstrap Graphify before push")
    else:
        graph = json.loads(graph_path.read_text(encoding="utf-8"))
        code_graph_sha = sha256_file(graph_path)
        if graph.get("built_at_commit") != head:
            errors.append("Graphify output was not built at HEAD")

    execution_graph_path = (
        root
        / str(
            config.get("executionGraph", {}).get(
                "path",
                ".agents/execution/"
                "skys-limit-sequential-tdd-execution-graph-audited.jsonl",
            )
        )
    ).resolve()
    execution_graph_sha = (
        sha256_file(execution_graph_path) if execution_graph_path.is_file() else ""
    )
    if not execution_graph_sha:
        errors.append(f"audited execution graph is missing: {execution_graph_path}")

    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    try:
        start, commits = outgoing_commits(
            root, head, str(config["enforceAfter"]), push_updates
        )
        if not commits:
            errors.append("push contains no governed commits")

        execution_import = connection.execute(
            "SELECT * FROM execution_graph_imports WHERE program_id = ?",
            (config.get("programId"),),
        ).fetchone()
        remote_reconciliation: dict[str, Any] | None = None
        if execution_import is None:
            errors.append("SQLite has no imported authority for this execution program")
            graph_id = ""
            expected_node = ""
            expected_stage = ""
        else:
            graph_id = str(execution_import["graph_id"])
            expected_node = str(execution_import["current_node"] or "")
            expected_stage = str(execution_import["current_stage"] or "")
            if not execution_import["graph_path"] or normalized(
                execution_import["graph_path"]
            ) != normalized(execution_graph_path):
                errors.append(
                    "SQLite execution authority belongs to another repository path"
                )
            if (
                execution_graph_sha
                and execution_import["graph_sha256"] != execution_graph_sha
            ):
                errors.append(
                    "SQLite execution authority digest does not match the governed graph"
                )
            if execution_import["validation_ok"] != 1:
                errors.append("SQLite execution authority is not validated")

            if start != str(config["enforceAfter"]):
                prior_handoff = connection.execute(
                    """
                    SELECT next_node, next_stage
                    FROM lifecycle_handoffs
                    WHERE program_id = ? AND head_sha = ?
                    ORDER BY created_at DESC, handoff_id DESC
                    LIMIT 1
                    """,
                    (config.get("programId"), start),
                ).fetchone()
                if prior_handoff is None:
                    (
                        prior_handoff,
                        remote_reconciliation,
                        reconciliation_error,
                    ) = resolve_remote_start_handoff(
                        root,
                        connection,
                        str(config.get("programId")),
                        start,
                        head,
                    )
                    if reconciliation_error:
                        errors.append(reconciliation_error)
                else:
                    expected_node = str(prior_handoff["next_node"])
                    expected_stage = str(prior_handoff["next_stage"])
                if prior_handoff is not None:
                    expected_node = str(prior_handoff["next_node"])
                    expected_stage = str(prior_handoff["next_stage"])

        reconciliation_evidenced = remote_reconciliation is None
        for commit in commits:
            values = trailers(git(root, "show", "-s", "--format=%B", commit))
            commit_checkpoint_id = values.get("Checkpoint-ID", "")
            commit_evidence_sha = values.get("Evidence-SHA256", "")
            checkpoint = connection.execute(
                """
                SELECT *
                FROM lifecycle_events
                WHERE checkpoint_id = ? AND event_type = 'checkpoint_completed'
                ORDER BY event_sequence DESC
                LIMIT 1
                """,
                (commit_checkpoint_id,),
            ).fetchone()
            if checkpoint is None:
                errors.append(
                    f"{commit[:12]} checkpoint is not completed in SQLite: "
                    f"{commit_checkpoint_id}"
                )
                continue
            started = connection.execute(
                """
                SELECT *
                FROM lifecycle_events
                WHERE checkpoint_id = ? AND event_type = 'checkpoint_started'
                ORDER BY event_sequence
                LIMIT 1
                """,
                (commit_checkpoint_id,),
            ).fetchone()
            if started is None:
                errors.append(f"{commit[:12]} checkpoint has no start event")
                continue
            commit_tree = git(root, "rev-parse", f"{commit}^{{tree}}")
            if checkpoint["program_id"] != config.get("programId"):
                errors.append(f"{commit[:12]} checkpoint belongs to another program")
            if checkpoint["node_id"] != values.get("Execution-Node"):
                errors.append(f"{commit[:12]} checkpoint node does not match the commit")
            if checkpoint["head_sha"] != commit or checkpoint["tree_sha"] != commit_tree:
                errors.append(
                    f"{commit[:12]} checkpoint is not bound to the exact commit and tree"
                )
            payload = json.loads(checkpoint["payload_json"])
            if not evidence_contains(payload.get("evidence"), commit_evidence_sha):
                errors.append(
                    f"{commit[:12]} checkpoint does not contain its evidence digest"
                )
            if remote_reconciliation and evidence_contains_remote_reconciliation(
                root,
                payload.get("evidence"),
                remote_reconciliation,
                commit_evidence_sha,
                f"refs/heads/{config['integrationBranch']}",
            ):
                reconciliation_evidenced = True
            if graph_id:
                started_stage = connection.execute(
                    """
                    SELECT node_id
                    FROM execution_stages
                    WHERE graph_id = ? AND stage_id = ?
                    """,
                    (graph_id, started["stage_id"]),
                ).fetchone()
                completed_stage = connection.execute(
                    """
                    SELECT node_id
                    FROM execution_stages
                    WHERE graph_id = ? AND stage_id = ?
                    """,
                    (graph_id, checkpoint["stage_id"]),
                ).fetchone()
                if (
                    started_stage is None
                    or started_stage["node_id"] != checkpoint["node_id"]
                ):
                    errors.append(
                        f"{commit[:12]} checkpoint start stage is not valid for its node"
                    )
                if (
                    completed_stage is None
                    or completed_stage["node_id"] != checkpoint["node_id"]
                ):
                    errors.append(
                        f"{commit[:12]} checkpoint completion stage is not valid for its node"
                    )
                if (
                    started["node_id"] != expected_node
                    or started["stage_id"] != expected_stage
                ):
                    errors.append(
                        f"{commit[:12]} checkpoint does not continue the execution cursor"
                    )

                handoffs = connection.execute(
                    """
                    SELECT *
                    FROM lifecycle_handoffs
                    WHERE program_id = ? AND checkpoint_id = ? AND head_sha = ?
                    """,
                    (config.get("programId"), commit_checkpoint_id, commit),
                ).fetchall()
                if len(handoffs) != 1:
                    errors.append(
                        f"{commit[:12]} requires exactly one exact-head handoff"
                    )
                else:
                    handoff = handoffs[0]
                    if (
                        handoff["node_id"] != checkpoint["node_id"]
                        or handoff["stage_id"] != checkpoint["stage_id"]
                    ):
                        errors.append(
                            f"{commit[:12]} handoff origin does not match its checkpoint"
                        )
                    transition = transition_error(
                        connection,
                        graph_id,
                        str(checkpoint["node_id"]),
                        str(started["stage_id"]),
                        str(checkpoint["stage_id"]),
                        str(handoff["next_node"]),
                        str(handoff["next_stage"]),
                        int(checkpoint["event_sequence"]),
                    )
                    if transition:
                        errors.append(f"{commit[:12]} {transition}")
                    expected_node = str(handoff["next_node"])
                    expected_stage = str(handoff["next_stage"])

        if not reconciliation_evidenced:
            errors.append(
                "remote advance is missing explicit remote_start_reconciliation evidence"
            )

        imports = connection.execute(
            "SELECT * FROM graphify_imports WHERE built_at_commit = ?",
            (head,),
        ).fetchall()
        matching_import = next(
            (
                row
                for row in imports
                if row["source_root"]
                and normalized(row["source_root"]) == normalized(root)
            ),
            None,
        )
        if matching_import is None:
            errors.append("SQLite has no Graphify import for this worktree at HEAD")
        elif code_graph_sha and matching_import["graph_sha256"] != code_graph_sha:
            errors.append("SQLite Graphify import digest does not match graphify-out/graph.json")
    except sqlite3.OperationalError as error:
        errors.append(f"control-plane schema is incomplete: {error}")
    finally:
        connection.close()

    return {
        "ok": not errors,
        "head": head,
        "checkpointId": checkpoint_id,
        "evidenceSha256": evidence_sha,
        "database": str(db_path),
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--db", type=Path)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--push-updates", action="store_true")
    args = parser.parse_args()
    push_updates = sys.stdin.read() if args.push_updates else None
    result = verify(
        args.root.resolve(),
        (args.db or runtime_database()).resolve(),
        push_updates,
    )
    if args.json or not result["ok"]:
        print(json.dumps(result, indent=2))
    else:
        print(
            "[Control Plane] OK: "
            f"{result['head'][:12]} checkpoint {result['checkpointId']}"
        )
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
