import { useEffect, useState } from 'react';
import { api } from './api.js';
import ClientForm from './components/ClientForm.jsx';
import ClientList from './components/ClientList.jsx';

export default function App() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setClients(await api.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Oculta el mensaje de éxito tras unos segundos
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  // Lanza el error al formulario para que muestre los detalles por campo
  async function handleSave(data) {
    setError('');
    if (editing) {
      const updated = await api.update(editing.id, data);
      setClients((list) => list.map((c) => (c.id === updated.id ? updated : c)));
      setEditing(null);
      setSuccess('Cliente actualizado');
    } else {
      const created = await api.create(data);
      setClients((list) => [...list, created]);
      setSuccess('Cliente creado');
    }
  }

  async function handleDelete(client) {
    if (!window.confirm(`¿Eliminar a ${client.name}?`)) return;
    setError('');
    try {
      await api.remove(client.id);
      setClients((list) => list.filter((c) => c.id !== client.id));
      if (editing?.id === client.id) setEditing(null);
      setSuccess('Cliente eliminado');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="container">
      <h1>Clientes</h1>

      <div aria-live="polite">
        {error && <p className="alert error">{error}</p>}
        {success && <p className="alert success">{success}</p>}
      </div>

      <ClientForm
        key={editing?.id || 'new'}
        client={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />

      <h2>Lista de clientes</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <ClientList clients={clients} onEdit={setEditing} onDelete={handleDelete} />
      )}
    </main>
  );
}
