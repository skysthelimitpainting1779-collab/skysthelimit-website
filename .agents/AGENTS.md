# Self-Healing Environment Guardrails

## Strict Mode: State Storage
- **NEVER** write dynamic, continuously changing agent or sidecar runtime state to `.agents/scratch/` or any other local project directory.
- **ALWAYS** read and write dynamic state payloads (like anomaly triggers) to `%ANTIGRAVITY_EXECUTABLE_DATA_DIR%`. This prevents recursive Git dirty states and maintains strict sandboxing.

## Process-Tree Execution Wrapper
- **NEVER** execute bare test or compilation commands directly (e.g., `npm run build`, `pytest`, `cargo test`) during autonomous operations.
- **ALWAYS** use the `hardened-validation` skill and wrap commands with `python .agents/skills/hardened-validation/scripts/run.py <command>`.
- **Why:** The wrapper manages strict timeouts and forcefully terminates the entire process tree. This guarantees all file handles are released, preventing Windows "Access is denied" lock crashes during automated Git worktree cleanup and rotation.

## IDE Customization Schemas
When creating or modifying Workflows or Rules for the Antigravity IDE, you MUST strictly adhere to these directory and YAML frontmatter schemas. Failure to do so will cause the IDE parser to fail and the customizations will not appear in the UI.

- **Workflows**: Must be placed in .agents/workflows/. Filenames must be lowercase with no spaces (e.g., my-workflow.md).
  Required Frontmatter:
  `yaml
  ---
  name: <slash-command-name>
  description: <short description>
  ---
  `
- **Rules**: Must be placed in .agents/rules/. Filenames must be lowercase with no spaces (e.g., my-rule.md).
  Required Frontmatter:
  `yaml
  ---
  trigger: always_on (or manual, model_decision)
  glob: (optional file matching)
  description: <short description>
  ---
  `
- **Plugins**: DO NOT place Workflows in plugins/<name>/workflows/, as the schema does not support them there. 
