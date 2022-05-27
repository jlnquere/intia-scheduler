import { createApp } from './app';
import config from './utils/config';

async function run() {
  const app = await createApp();

  // start the express server
  const server = app.listen(config.listeningPort, () => {
    console.info(`server started at http://localhost:${config.listeningPort}`);
  });

  // This is needed in a docker environment to allow fast stopping of the server
  const termSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  termSignals.forEach((sig: NodeJS.Signals) => {
    process.on(sig, () => {
      console.info('Server going offline');
      server.close();
      process.exit();
    });
  });
}
run();
