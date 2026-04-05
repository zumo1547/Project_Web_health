import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const npxCommand = "npx";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: true,
      env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? 1}`));
    });
  });
}

async function main() {
  const projectRoot = process.cwd();
  loadEnvFile(path.join(projectRoot, ".env"));
  loadEnvFile(path.join(projectRoot, ".env.local"));

  const runtimeDatabaseUrl = process.env.DATABASE_URL;
  const unpooledDatabaseUrl =
    process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;
  const schemaDatabaseUrl = unpooledDatabaseUrl || runtimeDatabaseUrl;

  if (!runtimeDatabaseUrl && !schemaDatabaseUrl) {
    throw new Error(
      "DATABASE_URL is missing. Configure DATABASE_URL in Vercel and optionally DATABASE_URL_UNPOOLED for schema updates.",
    );
  }

  console.log("Generating Prisma client...");
  await run(npxCommand, ["prisma", "generate"]);

  if (process.env.SKIP_DB_PUSH_ON_BUILD === "true") {
    console.log("Skipping prisma db push because SKIP_DB_PUSH_ON_BUILD=true");
  } else {
    console.log(
      unpooledDatabaseUrl
        ? "Syncing Prisma schema with DATABASE_URL_UNPOOLED before build..."
        : "Syncing Prisma schema with DATABASE_URL before build...",
    );

    await run(
      npxCommand,
      ["prisma", "db", "push"],
      {
        ...process.env,
        DATABASE_URL: schemaDatabaseUrl,
      },
    );
  }

  console.log("Building Next.js app...");
  await run(npxCommand, ["next", "build", "--webpack"]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
