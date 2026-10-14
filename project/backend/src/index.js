import { config } from './config.js';
import { createStore } from './store.js';
import { createApp } from './app.js';

const store = createStore(config.dataFile);
await store.init();

const app = createApp({ store, corsOrigins: config.corsOrigins });

app.listen(config.port, config.host, () => {
  console.log(`API escuchando en http://${config.host}:${config.port}`);
});
