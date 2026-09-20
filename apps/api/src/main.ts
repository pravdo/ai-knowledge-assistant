import { createApp } from './bootstrap.js';
import { logger } from './observability/logger.js';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen(port);
  logger.info(`api listening on port ${port}`);
}

void bootstrap();
