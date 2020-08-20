import http from 'http';
import config from 'config';

const port: number = config.get('server.port');

const request = http.request(
  {
    host: 'localhost',
    port,
    timeout: 1000,
  },
  (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    if (res.statusCode == 200) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  },
);

request.on('error', function (error: Error) {
  console.error(`Error calling healthcheck: ${error.message || error}`);
  process.exit(1);
});

request.end();
