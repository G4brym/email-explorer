const { execSync } = require("child_process");
const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const root = join(__dirname, "..");
const workerPkg = join(root, "packages", "worker", "package.json");
const templatePkg = join(root, "template", "package.json");

// Run the normal changeset versioning
execSync("pnpm changeset version", { cwd: root, stdio: "inherit" });

// Read the new worker version
const { version } = JSON.parse(readFileSync(workerPkg, "utf8"));

// Update the template dependency to match
const template = JSON.parse(readFileSync(templatePkg, "utf8"));
template.dependencies["email-explorer"] = `^${version}`;
writeFileSync(templatePkg, JSON.stringify(template, null, "\t") + "\n");

console.log(`Synced template/package.json email-explorer dependency to ^${version}`);
