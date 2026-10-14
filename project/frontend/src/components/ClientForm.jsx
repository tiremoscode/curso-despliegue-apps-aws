import { useState } from 'react';

const EMPTY = { name: '', email: '', phone: '', company: '' };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v) {
  const errors = {};
  if (!v.name.trim()) errors.name = 'El nombre es obligatorio';
  if (!v.email.trim()) errors.email = 'El correo es obligatorio';
  else if (!EMAIL_REGEX.test(v.email.trim())) errors.email = 'Formato de correo inválido';
  if (!v.phone.trim()) errors.phone = 'El teléfono es obligatorio';
  return errors;
}

export default function ClientForm({ client, onSave, onCancel }) {
  const [values, setValues] = useState(
    client
      ? { name: client.name, email: client.email, phone: client.phone, company: client.company || '' }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSave(values);
      if (!client) setValues(EMPTY); // al crear, limpia el formulario
    } catch (err) {
      setErrors(err.details || {});
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const field = (name, label, type = 'text', required = true) => (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={values[name]}
        onChange={handleChange}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] && <span className="field-error">{errors[name]}</span>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="card">
      <h2>{client ? 'Editar cliente' : 'Nuevo cliente'}</h2>
      {field('name', 'Nombre')}
      {field('email', 'Correo', 'email')}
      {field('phone', 'Teléfono', 'tel')}
      {field('company', 'Empresa', 'text', false)}
      {formError && <p className="alert error">{formError}</p>}
      <div className="actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : client ? 'Guardar cambios' : 'Crear cliente'}
        </button>
        {client && (
          <button type="button" className="secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
