import { buildApp } from './app.js';
import { config } from './config/index.js';

async function start() {
  const app = buildApp();

  try {
    const address = await app.listen({
      port: config.port,
      host: config.host,
    });
    console.log(`[MyLawyer Backend] Server running at ${address}`);
    console.log(`[MyLawyer Backend] Swagger docs available at ${address}/docs`);
  } catch (err) {
    console.error('[MyLawyer Backend] Fatal server error:', err);
    process.exit(1);
  }
}

start();
