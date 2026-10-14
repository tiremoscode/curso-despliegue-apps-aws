import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createStore } from './store.js';
import { validateClient } from './validate.js';

async function tmpStore() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'clients-'));
  const file = path.join(dir, 'clients.json');
  const store = createStore(file);
  await store.init();
  return { store, file };
}

test('init crea archivo con arreglo vacío', async () => {
  const { store } = await tmpStore();
  assert.deepEqual(await store.list(), []);
});

test('CRUD básico', async () => {
  const { store } = await tmpStore();
  const c = await store.create({ name: 'Ana', email: 'a@b.co', phone: '1', company: '' });
  assert.ok(c.id && c.createdAt);
  const u = await store.update(c.id, { name: 'Ana B', email: 'a@b.co', phone: '1', company: '' });
  assert.equal(u.name, 'Ana B');
  assert.equal(u.createdAt, c.createdAt);
  assert.equal(await store.remove(c.id), true);
  assert.equal(await store.remove(c.id), false);
});

test('escrituras simultáneas no corrompen el archivo', async () => {
  const { store, file } = await tmpStore();
  await Promise.all(
    Array.from({ length: 50 }, (_, i) =>
      store.create({ name: `N${i}`, email: `n${i}@x.co`, phone: '1', company: '' })
    )
  );
  const data = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(data.length, 50);
  assert.equal(new Set(data.map((c) => c.id)).size, 50);
});

test('validateClient', () => {
  assert.deepEqual(Object.keys(validateClient({}).errors).sort(), ['email', 'name', 'phone']);
  assert.ok(validateClient({ name: 'A', email: 'malo', phone: '1' }).errors.email);
  assert.deepEqual(validateClient({ name: 'A', email: 'a@b.co', phone: '1' }).errors, {});
});
