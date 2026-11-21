import { loadEnvironmentConfig, usersConfigSchema } from "@kinvue/config";
import { ConfigService } from "@nestjs/config";
import { MongoService } from "./mongo.service";

async function main() {
  const mongo = new MongoService(
    new ConfigService(loadEnvironmentConfig(usersConfigSchema)),
  );
  try {
    await mongo.check();
    console.log("Users indexes are ready");
  } finally {
    await mongo.onApplicationShutdown();
  }
}

void main().catch((error: unknown) => {
  console.error(
    "Users index setup failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  process.exitCode = 1;
});
