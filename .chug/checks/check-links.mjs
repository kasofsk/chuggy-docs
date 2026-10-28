import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execSync } from "node:child_process";

const files = execSync("git ls-files '*.md' llms.txt", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

const linkPattern = /\]\(([^)\s]+)\)/g;
const problems = [];

for (const file of files) {
  const dir = dirname(file);
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(linkPattern)) {
    const link = match[1];
    if (/^[a-z]+:\/\//i.test(link) || link.startsWith("#") || link.startsWith("mailto:")) {
      continue;
    }
    const target = link.split("#")[0];
    if (!target) continue;
    if (!existsSync(resolve(dir, target))) {
      problems.push(`${file}: broken link to ${link}`);
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(`ok: ${files.length} files, links resolve`);
