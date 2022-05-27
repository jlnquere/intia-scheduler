import * as config from 'config';

interface Config extends config.IConfig {
  listeningPort: number;
  redis: { url: string };
}
export default config as Config;
