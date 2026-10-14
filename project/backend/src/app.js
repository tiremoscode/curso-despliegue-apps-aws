import express from 'express';
import cors from 'cors';
import { clientsRouter } from './routes/clients.js';

export function createApp({ store, corsOrigins }) {
  const app = express();

  // '*' permite cualquier origen (útil para probar por HTTP en una IP pública)
  const origin = corsOrigins.includes('*') ? '*' : corsOrigins;
  app.use(cors({ origin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/clients', clientsRouter(store));

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Manejo global de errores: la API no se cae por fallos de archivo o JSON mal formado
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON mal formado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}
