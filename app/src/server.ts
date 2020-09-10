import http from 'http';
import { createApp } from './app';
import config from 'config';

const port: number = config.get('server.port');

export async function main(): Promise<void> {
  const { start, stop, logger } = createApp();

  try {
    await start();

    const requestListener: http.RequestListener = function (_, res) {
      res.writeHead(200);
      res.end();
    };

    const server = http.createServer(requestListener);
    server.listen(port, '0.0.0.0', () => {
      logger.info(`HTTP server listening on 0.0.0.0:${port}`);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: shutting down');
      await stop();

      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            logger.info('HTTP server closed');
            resolve();
          }
        });
      });
    });
  } catch (error) {
    logger.error('Encountered error during startup', { error: error.message || error, stack: error.stack });
    await stop();
    throw error;
  }
}
