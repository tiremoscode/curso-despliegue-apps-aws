import { Router } from 'express';
import { validateClient } from '../validate.js';

export function clientsRouter(store) {
  const router = Router();

  // Envuelve handlers async para enviar errores al middleware global
  const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

  router.get('/', wrap(async (req, res) => {
    res.json(await store.list());
  }));

  router.get('/:id', wrap(async (req, res) => {
    const client = await store.get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(client);
  }));

  router.post('/', wrap(async (req, res) => {
    const { errors, value } = validateClient(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors });
    }
    res.status(201).json(await store.create(value));
  }));

  router.put('/:id', wrap(async (req, res) => {
    const { errors, value } = validateClient(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors });
    }
    const client = await store.update(req.params.id, value);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(client);
  }));

  router.delete('/:id', wrap(async (req, res) => {
    const removed = await store.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.status(204).end();
  }));

  return router;
}
