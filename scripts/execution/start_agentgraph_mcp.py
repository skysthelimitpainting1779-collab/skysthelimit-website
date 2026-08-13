from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from control_plane import agentgraph_server, find_control_plane_workspace


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-path", action="store_true")
    args = parser.parse_args()

    workspace = find_control_plane_workspace()
    server = agentgraph_server(workspace)
    source_root = Path.cwd().resolve()
    if args.print_path:
        print(server)
        return 0

    os.environ["AGENTGRAPH_SOURCE_ROOT"] = str(source_root)
    os.chdir(workspace)
    os.execv(sys.executable, [sys.executable, str(server)])
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
