import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const explicit = process.argv[2];
let researchPath = explicit ? resolve(root, explicit) : null;

if (!researchPath) {
  const activePath = resolve(root, ".agents/goals/active.json");
  if (!existsSync(activePath)) {
    console.error("[context7] Missing .agents/goals/active.json");
    process.exit(1);
  }
  const active = JSON.parse(readFileSync(activePath, "utf8"));
  researchPath = resolve(root, active.path, "research.md");
}

if (!existsSync(researchPath)) {
  console.error(`[context7] Missing research file: ${researchPath}`);
  process.exit(1);
}

const text = readFileSync(researchPath, "utf8");
const afterHeading = text.split(/^## Context7 contracts\s*$/m)[1];
if (afterHeading === undefined) {
  console.error("[context7] Add a '## Context7 contracts' section to goal research.");
  process.exit(1);
}

const section = afterHeading.split(/^##\s/m)[0].trim();
const notApplicableMatch = section.match(
  /Applicability:[ \t]*not-applicable[ \t]*[—-][ \t]*([^\r\n]*\S[^\r\n]*)/i,
);
const libraryId = section.match(/Library ID:\s*`?(\/[a-z0-9_.-]+\/[a-z0-9_.-]+)`?/i);
const contractMatch = section.match(/Contract:[ \t]*([^\r\n]*\S[^\r\n]*)/i);
const notApplicableReason = notApplicableMatch?.[1].trim();
const contract = contractMatch?.[1].trim();

if (
  !(notApplicableReason && notApplicableReason.length >= 12) &&
  !(libraryId && contract && contract.length >= 12)
) {
  console.error(
    "[context7] Record a Context7 Library ID plus Contract, or a reasoned not-applicable declaration.",
  );
  process.exit(1);
}

console.log(`[context7] contract evidence valid: ${researchPath}`);
