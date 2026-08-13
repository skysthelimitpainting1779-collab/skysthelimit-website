---
name: universal-ci
description: Natively validates the repository structure, generates CI pipelines, and enforces auto-commit git discipline using programmatic Python scripts to save tokens.
---

# Universal CI Discipline

You have been invoked to enforce strict Continuous Integration and Git discipline across the repository.

## Step 1: Structural Audit & Generation
Instead of generating CI pipelines with LLM tokens, execute the auto-auditor script:
`python .agents/skills/universal-ci/scripts/setup_ci.py`
This will instantly build `.github/workflows/ci.yml`, `vercel.json`, and `.graphifyignore` natively.

## Step 2: Auto-Commit & Push (Git Discipline)
Instead of writing terminal git commands manually, execute the auto-commit script:
`python .agents/skills/universal-ci/scripts/auto_commit.py`
This script will validate the repository, and if valid, stage and commit the changes to origin.

## Step 3: Failure Catching
If `auto_commit.py` fails (exit code > 0), you **MUST** halt this workflow and trigger the healing node:
`agentapi new-conversation /workflow_heal_project`
