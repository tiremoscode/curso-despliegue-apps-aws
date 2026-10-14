import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Cola simple: cada operación de escritura espera a la anterior,
// así dos solicitudes simultáneas nunca pisan el archivo.
export function createStore(filePath) {
  let queue = Promise.resolve();

  async function init() {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, '[]\n');
    }
  }

  async function readAll() {
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('El archivo de datos no contiene un arreglo');
    return data;
  }

  async function writeAll(clients) {
    // Escribe a archivo temporal y renombra: el cambio es atómico.
    const tmp = `${filePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(clients, null, 2) + '\n');
    await fs.rename(tmp, filePath);
  }

  // Encadena una operación de lectura+escritura a la cola.
  function mutate(fn) {
    const run = queue.then(async () => {
      const clients = await readAll();
      const result = await fn(clients);
      if (result.changed) await writeAll(clients);
      return result.value;
    });
    queue = run.catch(() => {}); // un fallo no bloquea la cola
    return run;
  }

  return {
    init,
    list: () => readAll(),
    get: async (id) => (await readAll()).find((c) => c.id === id) || null,
    create: (data) =>
      mutate((clients) => {
        const client = {
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        clients.push(client);
        return { changed: true, value: client };
      }),
    update: (id, data) =>
      mutate((clients) => {
        const i = clients.findIndex((c) => c.id === id);
        if (i === -1) return { changed: false, value: null };
        clients[i] = { ...clients[i], ...data, id: clients[i].id, createdAt: clients[i].createdAt };
        return { changed: true, value: clients[i] };
      }),
    remove: (id) =>
      mutate((clients) => {
        const i = clients.findIndex((c) => c.id === id);
        if (i === -1) return { changed: false, value: false };
        clients.splice(i, 1);
        return { changed: true, value: true };
      }),
  };
}
