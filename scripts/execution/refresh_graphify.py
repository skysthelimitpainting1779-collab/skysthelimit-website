from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def graphify_command(root: Path) -> list[str]:
    executable = shutil.which("graphify")
    if executable:
        return [executable]
    interpreter_file = root / "graphify-out" / ".graphify_python"
    if interpreter_file.is_file():
        interpreter = Path(interpreter_file.read_text(encoding="utf-8").strip())
        if interpreter.is_file():
            return [str(interpreter), "-m", "graphify.cli"]
    raise FileNotFoundError(
        "graphify is unavailable; install graphifyy or expose graphify on PATH"
    )


def git_head(root: Path) -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--timeout", type=int, default=900)
    args = parser.parse_args()
    root = args.root.resolve()
    graph_path = root / "graphify-out" / "graph.json"
    command = [*graphify_command(root), str(root), "--no-viz"]
    if graph_path.is_file():
        command.append("--update")

    environment = {
        **os.environ,
        "PYTHONHASHSEED": "0",
        "GRAPHIFY_MAX_WORKERS": os.environ.get(
            "GRAPHIFY_MAX_WORKERS", "1" if os.name == "nt" else ""
        ),
    }
    if not environment["GRAPHIFY_MAX_WORKERS"]:
        environment.pop("GRAPHIFY_MAX_WORKERS")
    subprocess.run(
        command,
        cwd=root,
        env=environment,
        check=True,
        timeout=max(60, args.timeout),
    )
    if not graph_path.is_file():
        raise FileNotFoundError("Graphify completed without graphify-out/graph.json")

    graph = json.loads(graph_path.read_text(encoding="utf-8"))
    head = git_head(root)
    if graph.get("built_at_commit") != head:
        raise RuntimeError(
            "Graphify output is stale: "
            f"built_at_commit={graph.get('built_at_commit')!r}, HEAD={head}"
        )
    subprocess.run(
        [
            sys.executable,
            str(root / "scripts" / "execution" / "sync_graphify_control_plane.py"),
            "--prune",
        ],
        cwd=root,
        check=True,
        timeout=180,
    )
    print(f"[Graphify] refreshed and synced {head[:12]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
