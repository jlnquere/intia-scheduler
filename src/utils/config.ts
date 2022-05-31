import * as config from 'config';

interface Config extends config.IConfig {
  listeningPort: number;
  mongo: { url: string };
}
export default config as Config;
