import type { Env } from './env';
import { app } from './http/app';
import { cleanUpUnusedMedia } from './scheduled/media-cleanup';

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(cleanUpUnusedMedia(env));
  },
} satisfies ExportedHandler<Env>;
