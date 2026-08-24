---
name: fix-syntax
description: A brutally simple, grounded skill to fix syntax or compile errors in a specific file. No swarms. No grand architecture. Just fixes the bug.
---

# Fix Syntax

**When to trigger this skill:**
Trigger this when the user encounters a syntax error, compilation error, or path error, and needs it fixed immediately.

## The Operating Procedure (No Abstractions Allowed)

1. **Locate the target file.** Look at the error log and find the exact file path and line number where the error occurred.
2. **Read the file.** Use `view_file` to read the exact lines surrounding the error.
3. **Fix the error.** Use `replace_file_content` or `multi_replace_file_content` to fix the missing parenthesis, bracket, typo, or import path.
4. **Verify the fix.** Run the exact command that failed (e.g., `npm run build` or `node script.js`) in the terminal.
5. **Stop.** Do not spawn sub-agents. Do not write a 4-tier testing plan. Do not redesign the architecture. Report that the error is fixed and wait for the user.

*Remember: You are here to fix a broken tool, not build an empire.*
