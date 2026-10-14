const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (data === null) throw new Error('Respuesta inválida del servidor (¿URL de la API incorrecta?)');
  if (!res.ok) {
    const err = new Error(data.error || 'Error en la solicitud');
    err.details = data.details;
    throw err;
  }
  return data;
}

export const api = {
  list: async () => {
    const data = await request('/clients');
    if (!Array.isArray(data)) throw new Error('Respuesta inválida del servidor');
    return data;
  },
  create: (client) => request('/clients', { method: 'POST', body: JSON.stringify(client) }),
  update: (id, client) =>
    request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(client) }),
  remove: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
};
