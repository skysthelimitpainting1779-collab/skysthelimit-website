from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from control_plane import (
    execution_sqlite_script,
    find_control_plane_workspace,
    graphify_sqlite_script,
    runtime_database_path,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prune", action="store_true")
    parser.add_argument("--print-command", action="store_true")
    args = parser.parse_args()

    workspace = find_control_plane_workspace()
    repository = Path.cwd().resolve()
    database = runtime_database_path().resolve()
    graph_command = [
        sys.executable,
        str(graphify_sqlite_script(workspace)),
        "--db",
        str(database),
        "sync",
        "--root",
        str(workspace),
    ]
    if args.prune:
        graph_command.append("--prune")
    execution_graph = (
        repository
        / ".agents"
        / "execution"
        / "skys-limit-sequential-tdd-execution-graph-audited.jsonl"
    )
    execution_command = [
        sys.executable,
        str(execution_sqlite_script(workspace)),
        "--db",
        str(database),
        "import",
        "--graph",
        str(execution_graph),
    ]
    if args.print_command:
        print("\n".join((*graph_command, "---", *execution_command)))
        return 0
    subprocess.run(graph_command, check=True)
    subprocess.run(execution_command, check=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
