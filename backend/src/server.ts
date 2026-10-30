import { buildApp } from './app.js';
import { config } from './config/index.js';
import { runMigrations } from './database/migrate.js';

async function start() {
  try {
    // 1. Ensure latest database migrations are applied
    await runMigrations(false);

    // 2. Build Fastify application
    const app = buildApp();

    // 3. Listen on configured host and port
    const address = await app.listen({
      port: config.port,
      host: config.host,
    });
    console.log(`[MyLawyer Backend] Server running at ${address}`);
    console.log(`[MyLawyer Backend] Swagger docs available at ${address}/docs`);
  } catch (err) {
    console.error('[MyLawyer Backend] Fatal server startup error:', err);
    process.exit(1);
  }
}

start();
