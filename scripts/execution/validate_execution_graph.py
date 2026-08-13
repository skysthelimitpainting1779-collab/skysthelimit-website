#!/usr/bin/env python3
"""Schema and semantic validator for Sky's the Limit execution JSONL."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict, deque
from pathlib import Path
from typing import Any, Iterable


def read_jsonl(path: Path) -> tuple[list[dict[str, Any]], list[str]]:
    rows: list[dict[str, Any]] = []
    errors: list[str] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_no, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as exc:
                errors.append(f"line {line_no}: invalid JSON: {exc}")
                continue
            row["__line__"] = line_no
            rows.append(row)
    return rows, errors


def topological_order(vertices: Iterable[str], edges: Iterable[tuple[str, str]]) -> tuple[list[str], list[str]]:
    vertices = list(dict.fromkeys(vertices))
    adjacency: dict[str, set[str]] = {v: set() for v in vertices}
    indegree = {v: 0 for v in vertices}
    for left, right in edges:
        if left not in adjacency or right not in adjacency or right in adjacency[left]:
            continue
        adjacency[left].add(right)
        indegree[right] += 1
    ready = deque(sorted(v for v, degree in indegree.items() if degree == 0))
    order: list[str] = []
    while ready:
        current = ready.popleft()
        order.append(current)
        for child in sorted(adjacency[current]):
            indegree[child] -= 1
            if indegree[child] == 0:
                ready.append(child)
    return order, sorted(v for v, degree in indegree.items() if degree > 0)


def strongly_connected_components(vertices: Iterable[str], edges: Iterable[tuple[str, str]]) -> list[list[str]]:
    adjacency: dict[str, list[str]] = defaultdict(list)
    for left, right in edges:
        adjacency[left].append(right)
    index = 0
    stack: list[str] = []
    on_stack: set[str] = set()
    indices: dict[str, int] = {}
    low: dict[str, int] = {}
    result: list[list[str]] = []

    def visit(vertex: str) -> None:
        nonlocal index
        indices[vertex] = low[vertex] = index
        index += 1
        stack.append(vertex)
        on_stack.add(vertex)
        for child in adjacency.get(vertex, []):
            if child not in indices:
                visit(child)
                low[vertex] = min(low[vertex], low[child])
            elif child in on_stack:
                low[vertex] = min(low[vertex], indices[child])
        if low[vertex] == indices[vertex]:
            component: list[str] = []
            while True:
                child = stack.pop()
                on_stack.remove(child)
                component.append(child)
                if child == vertex:
                    break
            result.append(sorted(component))

    for vertex in vertices:
        if vertex not in indices:
            visit(vertex)
    return [component for component in result if len(component) > 1]


def validate_schema(rows: list[dict[str, Any]], schema_path: Path) -> list[str]:
    try:
        from jsonschema import Draft202012Validator
    except ImportError:
        return ["jsonschema package is required for schema validation"]
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    errors: list[str] = []
    for row in rows:
        clean = {k: v for k, v in row.items() if k != "__line__"}
        for error in sorted(validator.iter_errors(clean), key=lambda item: list(item.path)):
            path = ".".join(str(part) for part in error.path) or "<record>"
            errors.append(f"line {row['__line__']} {row.get('recordId', '<missing>')} {path}: {error.message}")
    return errors


def semantic_validate(rows: list[dict[str, Any]]) -> tuple[list[str], dict[str, Any]]:
    errors: list[str] = []
    warnings: list[str] = []
    by_type: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_type[row.get("recordType", "<missing>")].append(row)

    record_ids = [row.get("recordId") for row in rows]
    for record_id, count in Counter(record_ids).items():
        if record_id is None:
            errors.append("one or more records are missing recordId")
        elif count > 1:
            errors.append(f"duplicate recordId: {record_id} ({count})")

    for required_type in ("program", "state_snapshot", "execution_cursor", "stop_condition"):
        if len(by_type[required_type]) != 1:
            errors.append(f"expected exactly one {required_type}, found {len(by_type[required_type])}")

    nodes = {row.get("nodeId"): row for row in by_type["node"] if row.get("nodeId")}
    if len(nodes) != len(by_type["node"]):
        errors.append("duplicate or missing nodeId")

    dependency_edges: list[tuple[str, str]] = []
    for node_id, node in nodes.items():
        deps = node.get("dependsOn", [])
        if len(deps) != len(set(deps)):
            errors.append(f"{node_id}: duplicate dependsOn entries")
        for parent in deps:
            if parent not in nodes:
                errors.append(f"{node_id}: missing dependency node {parent}")
            elif parent == node_id:
                errors.append(f"{node_id}: self dependency")
            else:
                dependency_edges.append((parent, node_id))
    node_order, stuck_nodes = topological_order(nodes, dependency_edges)
    if stuck_nodes:
        components = strongly_connected_components(nodes, dependency_edges)
        errors.append(f"node dependency graph is cyclic; stuck={stuck_nodes}; scc={components}")

    stages_by_node: dict[str, list[dict[str, Any]]] = defaultdict(list)
    stages_by_id: dict[str, dict[str, Any]] = {}
    for stage in by_type["stage"]:
        stage_id = stage.get("stageId")
        node_id = stage.get("nodeId")
        if not stage_id or stage_id in stages_by_id:
            errors.append(f"duplicate or missing stageId: {stage_id}")
            continue
        stages_by_id[stage_id] = stage
        if node_id not in nodes:
            errors.append(f"{stage_id}: nodeId does not exist: {node_id}")
        stages_by_node[node_id].append(stage)

    first_stage: dict[str, str] = {}
    last_stage: dict[str, str] = {}
    for node_id in nodes:
        items = sorted(stages_by_node.get(node_id, []), key=lambda row: row.get("ordinal", 0))
        if not items:
            errors.append(f"{node_id}: no stages")
            continue
        ordinals = [item.get("ordinal") for item in items]
        expected = list(range(1, len(items) + 1))
        if ordinals != expected:
            errors.append(f"{node_id}: non-contiguous stage ordinals: {ordinals}")
        names = [item.get("stage") for item in items]
        if len(names) != len(set(names)):
            errors.append(f"{node_id}: duplicate stage names")
        first_stage[node_id] = items[0]["stageId"]
        last_stage[node_id] = items[-1]["stageId"]
        status = nodes[node_id].get("status", "")
        stage_statuses = {item.get("status") for item in items}
        if status == "historical_complete_do_not_replay" and stage_statuses != {"historical_complete_do_not_replay"}:
            errors.append(f"{node_id}: historical node has non-historical stage statuses {sorted(stage_statuses)}")
        if status.startswith("blocked") and stage_statuses != {"blocked"}:
            errors.append(f"{node_id}: blocked node has non-blocked stage statuses {sorted(stage_statuses)}")

    executable_edges: list[tuple[str, str]] = []
    edge_records = by_type["edge"]
    edge_ids = set()
    for edge in edge_records:
        edge_id = edge.get("recordId")
        if edge_id in edge_ids:
            errors.append(f"duplicate edge recordId: {edge_id}")
        edge_ids.add(edge_id)
        left, right = edge.get("from"), edge.get("to")
        if left not in stages_by_id:
            errors.append(f"{edge_id}: missing from stage {left}")
        if right not in stages_by_id:
            errors.append(f"{edge_id}: missing to stage {right}")
        if left in stages_by_id and right in stages_by_id:
            executable_edges.append((left, right))

    stage_order, stuck_stages = topological_order(stages_by_id, executable_edges)
    sccs: list[list[str]] = []
    if stuck_stages:
        sccs = strongly_connected_components(stages_by_id, executable_edges)
        summaries = []
        for component in sccs:
            component_nodes = sorted({stages_by_id[stage_id].get("nodeId") for stage_id in component})
            summaries.append({"stageCount": len(component), "nodes": component_nodes})
        errors.append(f"executable stage graph is cyclic; components={summaries}")

    # Each node's stage chain must be represented exactly.
    stage_sequence_pairs = {
        (edge.get("from"), edge.get("to"))
        for edge in edge_records if edge.get("edgeType") == "stage_sequence"
    }
    for node_id, items in stages_by_node.items():
        items = sorted(items, key=lambda row: row.get("ordinal", 0))
        for left, right in zip(items, items[1:]):
            if (left["stageId"], right["stageId"]) not in stage_sequence_pairs:
                errors.append(f"{node_id}: missing stage_sequence {left['stageId']} -> {right['stageId']}")

    dependency_stage_pairs = {
        (edge.get("from"), edge.get("to"))
        for edge in edge_records
        if edge.get("edgeType") in {"node_dependency", "synthetic_dependency"}
    }
    expected_dependency_stage_pairs = {
        (last_stage[parent], first_stage[child])
        for parent, child in dependency_edges
        if parent in last_stage and child in first_stage
    }
    for pair in sorted(expected_dependency_stage_pairs - dependency_stage_pairs):
        errors.append(f"missing executable dependency edge: {pair[0]} -> {pair[1]}")
    for pair in sorted(dependency_stage_pairs - expected_dependency_stage_pairs):
        errors.append(f"executable dependency edge has no node dependsOn truth: {pair[0]} -> {pair[1]}")

    ranked = [(node.get("sequentialRank"), node_id) for node_id, node in nodes.items() if node.get("sequentialRank") is not None]
    ranked.sort()
    ranks = [rank for rank, _ in ranked]
    if ranks != list(range(1, len(ranks) + 1)):
        errors.append(f"sequential ranks must be unique and contiguous from 1; got {ranks}")
    rank_by_node = {node_id: rank for rank, node_id in ranked}
    for rank, node_id in ranked:
        status = nodes[node_id].get("status")
        if status != "pending":
            errors.append(f"{node_id}: ranked node must be pending, got {status}")
    for parent, child in dependency_edges:
        if parent in rank_by_node and child in rank_by_node and rank_by_node[parent] >= rank_by_node[child]:
            errors.append(f"rank violates dependency: {parent}({rank_by_node[parent]}) -> {child}({rank_by_node[child]})")
    pending_nodes = {node_id for node_id, node in nodes.items() if node.get("status") == "pending"}
    if set(rank_by_node) != pending_nodes:
        errors.append(f"ranked nodes must equal pending nodes; missing={sorted(pending_nodes-set(rank_by_node))}; extra={sorted(set(rank_by_node)-pending_nodes)}")

    expected_serial_pairs = {
        (last_stage[left], first_stage[right])
        for (_, left), (_, right) in zip(ranked, ranked[1:])
        if left in last_stage and right in first_stage
    }
    actual_serial_pairs = {
        (edge.get("from"), edge.get("to"))
        for edge in edge_records if edge.get("edgeType") == "global_serialization"
    }
    if expected_serial_pairs != actual_serial_pairs:
        errors.append(
            "global serialization does not match adjacent ranked nodes; "
            f"missing={sorted(expected_serial_pairs-actual_serial_pairs)}; extra={sorted(actual_serial_pairs-expected_serial_pairs)}"
        )

    if by_type["execution_cursor"]:
        cursor = by_type["execution_cursor"][0]
        current_node = cursor.get("currentNode")
        current_stage = cursor.get("currentStage")
        if current_node not in nodes:
            errors.append(f"cursor currentNode missing: {current_node}")
        if current_stage not in stages_by_id:
            errors.append(f"cursor currentStage missing: {current_stage}")
        elif stages_by_id[current_stage].get("nodeId") != current_node:
            errors.append("cursor currentStage does not belong to currentNode")
        if ranked and current_node != ranked[0][1]:
            errors.append(f"cursor must point to sequential rank 1; cursor={current_node}, rank1={ranked[0][1]}")
        if cursor.get("productionExecutionAllowed") is not False:
            errors.append("cursor productionExecutionAllowed must be false before G70")

    if by_type["program"] and by_type["state_snapshot"]:
        program = by_type["program"][0]
        state = by_type["state_snapshot"][0]
        if program.get("currentHead") != state.get("currentHead"):
            errors.append("program currentHead does not match state_snapshot currentHead")
        if program.get("resumeGate") != state.get("currentGate"):
            errors.append("program resumeGate does not match state_snapshot currentGate")
        if state.get("productionMutationAuthorized") is not False:
            errors.append("productionMutationAuthorized must remain false")

    for node_id in ("STL-504", "STL-505", "G70-CUTOVER-READY", "G80-CUTOVER-COMPLETE", "G85-ROLLBACK-WINDOW-CLEARED", "G90-DECOMMISSIONED", "STOP-PRE-G70"):
        if node_id in nodes:
            node = nodes[node_id]
            if not str(node.get("status", "")).startswith("blocked"):
                errors.append(f"{node_id}: must be blocked before explicit production approval")
            if node.get("sequentialRank") is not None:
                errors.append(f"{node_id}: blocked production node must not be ranked")

    for node_id in ("G20-FOUNDATION-READY", "G25-DESIGN-GOVERNANCE-READY", "PR-001-OPEN-DRAFT"):
        if node_id in nodes and nodes[node_id].get("status") != "historical_complete_do_not_replay":
            errors.append(f"{node_id}: live repository evidence says this step is complete and must not replay")

    if "G70-PACKET-ASSEMBLE" in nodes:
        required_packet_deps = {"G30-PUBLIC-CMS-READY", "G31-VISITOR-TO-BOOKING", "G40-PROPOSAL-TO-DEPOSIT", "G50-PORTAL-OPS-READY", "G60-MEASUREMENT-READY", "STL-506"}
        actual = set(nodes["G70-PACKET-ASSEMBLE"].get("dependsOn", []))
        if not required_packet_deps.issubset(actual):
            errors.append(f"G70-PACKET-ASSEMBLE is missing readiness dependencies: {sorted(required_packet_deps-actual)}")

    report = {
        "ok": not errors,
        "errors": errors,
        "warnings": warnings,
        "counts": {record_type: len(items) for record_type, items in sorted(by_type.items())},
        "nodeDependencyEdges": len(dependency_edges),
        "nodeDag": not stuck_nodes,
        "stageDag": not stuck_stages,
        "stageCycleComponents": [
            {
                "stageCount": len(component),
                "nodes": sorted({stages_by_id[stage_id].get("nodeId") for stage_id in component}),
            }
            for component in sccs
        ],
        "runnableNodes": [node_id for _, node_id in ranked],
        "currentCursor": by_type["execution_cursor"][0].get("currentStage") if by_type["execution_cursor"] else None,
    }
    return errors, report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("graph", type=Path)
    parser.add_argument("--schema", type=Path)
    parser.add_argument("--skip-schema", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    rows, parse_errors = read_jsonl(args.graph)
    schema_errors: list[str] = []
    if not args.skip_schema:
        if not args.schema:
            schema_errors.append("--schema is required unless --skip-schema is used")
        else:
            schema_errors = validate_schema(rows, args.schema)
    semantic_errors, report = semantic_validate(rows)
    all_errors = parse_errors + schema_errors + semantic_errors
    report.update({
        "ok": not all_errors,
        "graph": str(args.graph),
        "schema": None if args.skip_schema else str(args.schema) if args.schema else None,
        "sha256": hashlib.sha256(args.graph.read_bytes()).hexdigest(),
        "parseErrorCount": len(parse_errors),
        "schemaErrorCount": len(schema_errors),
        "semanticErrorCount": len(semantic_errors),
        "errors": all_errors,
    })
    output = json.dumps(report, indent=2)
    if args.output:
        args.output.write_text(output + "\n", encoding="utf-8")
    print(output)
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
