export default function ClientList({ clients, onEdit, onDelete }) {
  if (clients.length === 0) return <p>No hay clientes registrados.</p>;

  return (
    <ul className="list">
      {clients.map((c) => (
        <li key={c.id} className="card">
          <strong>{c.name}</strong>
          <span>{c.email}</span>
          <span>{c.phone}</span>
          {c.company && <span>{c.company}</span>}
          <small>Creado: {new Date(c.createdAt).toLocaleString()}</small>
          <div className="actions">
            <button type="button" className="secondary" onClick={() => onEdit(c)}>
              Editar
            </button>
            <button type="button" className="danger" onClick={() => onDelete(c)}>
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
