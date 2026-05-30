import { spawnSync } from "node:child_process";

const isCi = process.env.CI === "true" || Boolean(process.env.VERCEL);
const commands = isCi
  ? ["gallery:verify", "catalog:verify"]
  : ["gallery:build", "catalog:build"];

function runScript(scriptName) {
  if (process.platform === "win32") {
    return spawnSync("cmd.exe", ["/c", "npm", "run", scriptName], {
      stdio: "inherit",
      env: process.env,
    });
  }

  return spawnSync("npm", ["run", scriptName], {
    stdio: "inherit",
    env: process.env,
  });
}

for (const scriptName of commands) {
  console.log(`Running ${scriptName}...`);
  const result = runScript(scriptName);

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
