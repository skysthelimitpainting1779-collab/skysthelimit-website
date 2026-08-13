---
name: windows-cache-relief
description: Audit and reclaim low Windows system-drive space by relocating rebuildable development caches to a larger drive with supported configuration. Use for low-disk alerts, recurring cache maintenance, or requests to move npm, Playwright, Python, build, and temporary caches off C safely.
---

# Windows Cache Relief

Use native PowerShell end-to-end and keep an exact action ledger.

1. Record free space on source and destination drives.
2. Inspect only explicit cache paths and measure each before acting. Check relevant running processes.
3. Exclude repositories, documents, credentials, application databases, Codex/agent data, plugin installs, attachments, and active-process files.
4. Prefer supported cache configuration over junctions:
   - set tool-specific cache/environment configuration to the destination;
   - create the destination directory;
   - move the verified cache contents;
   - retain or recreate the expected source directory only when the tool requires it.
5. Delete only paths proven to be disposable generated cache or temporary build output. Never use a broad recursive target, unresolved variable, or wildcard for deletion.
6. For project build caches, verify the exact repository and exclude the active project before removal.
7. Verify the tool now resolves to the destination, record final free space, and report every exact moved, deleted, skipped, and configured path.

If a move fails because files are locked, skip that cache and report it; do not stop processes unless explicitly authorized.
