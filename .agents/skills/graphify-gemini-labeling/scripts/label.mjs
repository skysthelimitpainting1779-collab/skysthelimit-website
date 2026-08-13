import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync("graphify-out/graph.json")) {
  console.error("Missing graphify-out/graph.json; run the incremental graph update first.");
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.error("Set GEMINI_API_KEY or GOOGLE_API_KEY securely before labeling.");
  process.exit(1);
}

const model = process.env.GRAPHIFY_GEMINI_MODEL || "gemini-3.1-flash-lite";
if (!/^gemini-[A-Za-z0-9._-]+$/.test(model)) {
  console.error("GRAPHIFY_GEMINI_MODEL must be a Gemini model identifier beginning with 'gemini-'.");
  process.exit(1);
}

const executable = process.platform === "win32" ? "graphify.exe" : "graphify";
const result = spawnSync(
  executable,
  ["label", ".", "--backend", "gemini", "--model", model, "--no-viz", "--timing"],
  { env: process.env, stdio: "inherit", windowsHide: true, shell: false },
);

process.exit(result.status ?? 1);
