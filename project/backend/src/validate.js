const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Devuelve { errors, value }. Si errors está vacío, value es válido.
export function validateClient(body) {
  const errors = {};
  const input = body && typeof body === 'object' ? body : {};
  const clean = (v) => (typeof v === 'string' ? v.trim() : '');

  const value = {
    name: clean(input.name),
    email: clean(input.email),
    phone: clean(input.phone),
    company: clean(input.company),
  };

  if (!value.name) errors.name = 'El nombre es obligatorio';
  else if (value.name.length > 100) errors.name = 'Máximo 100 caracteres';

  if (!value.email) errors.email = 'El correo es obligatorio';
  else if (!EMAIL_REGEX.test(value.email)) errors.email = 'Formato de correo inválido';
  else if (value.email.length > 150) errors.email = 'Máximo 150 caracteres';

  if (!value.phone) errors.phone = 'El teléfono es obligatorio';
  else if (value.phone.length > 30) errors.phone = 'Máximo 30 caracteres';

  if (value.company.length > 100) errors.company = 'Máximo 100 caracteres';

  return { errors, value };
}
