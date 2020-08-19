import * as Sentry from '@sentry/node';
import { RewriteFrames } from '@sentry/integrations';
import config from 'config';
import { main } from './server';

// Fix stack trace frames in Sentry
global.__rootdir__ = __dirname || process.cwd();
Sentry.init({
  enabled: config.get('sentry.enabled'),
  dsn: config.get('sentry.dsn'),
  integrations: [
    new RewriteFrames({
      root: global.__rootdir__,
    }),
  ],
});

main().catch((err: Error) => {
  console.error(err);
  Sentry.captureException(err);
  process.exit(1);
});
