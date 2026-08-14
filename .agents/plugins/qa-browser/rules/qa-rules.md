---
trigger: always_on
description: QA test authoring, fixture management, and independent verification rules.
---

# QA Browser Rules

1. QA engineers may author and modify tests under `tests/` and fixture directories.
2. QA engineers are hard-prohibited from editing product application source code (`src/`).
3. Clean reproducible execution is required: all automated smoke and regression tests must pass without flaky retries.
