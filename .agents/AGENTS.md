# Antigravity runtime adapter

Canonical universal policy: [KERNEL.md](KERNEL.md)

Antigravity loads the kernel through the always-on rule at `rules/00-kernel.md`. Domain agents, verifiers, specialists, hooks, plugins, MCPs, and skills add only scoped capabilities; they never override the kernel.

Runtime state belongs in `%ANTIGRAVITY_EXECUTABLE_DATA_DIR%` or ignored `.learnings/` files. Repository source definitions remain portable and contain no machine-specific paths.
