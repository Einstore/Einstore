import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src");
const testFiles = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      testFiles.push(fullPath);
    }
  }
};

const cliFiles = process.argv.slice(2).filter(Boolean);
if (cliFiles.length) {
  for (const file of cliFiles) {
    const resolved = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    testFiles.push(resolved);
  }
} else {
  walk(root);
  testFiles.sort();
}

if (!testFiles.length) {
  console.log("No test files found.");
  process.exit(0);
}

for (const file of testFiles) {
  const result = spawnSync(
    path.resolve(process.cwd(), "node_modules", ".bin", "vitest"),
    [
      "run",
      "--pool=forks",
      "--poolOptions.forks.singleFork",
      "--no-file-parallelism",
      "--sequence.concurrent=false",
      file,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--max-old-space-size=8192",
      },
    },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
