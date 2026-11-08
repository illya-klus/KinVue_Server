import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { MeilisearchIndexSetupService } from "../modules/meilisearch/meilisearch-index-setup.service";
import { MovieReconcileService } from "../modules/reconcile/movie-reconcile.service";

async function main(): Promise<void> {
  const logger = new Logger("search:rebuild");
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });

  try {
    await app.get(MeilisearchIndexSetupService).ensureIndexSettings();
    const count = await app.get(MovieReconcileService).rebuildFullIndex();
    logger.log(`Meilisearch rebuild complete (${count} published movies)`);
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
