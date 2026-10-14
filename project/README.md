# clients-crud

Aplicación sencilla para gestionar clientes (crear, listar, editar y eliminar). Monorepo con npm workspaces: frontend (React + Vite) y backend (Node.js + Express) separados. Los datos se guardan en un archivo JSON local (`backend/data/clients.json`). No usa base de datos ni servicios externos.

## Requisitos

- Node.js 18 o superior (probado con Node 22)
- npm 9 o superior

## Instalación

```bash
npm install            # instala todos los workspaces (alias: npm run install:all)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Ejecución

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Backend (http://localhost:3001) y frontend (http://localhost:5173) en modo desarrollo |
| `npm run build` | Construye el frontend en `frontend/dist` |
| `npm start` | Ejecuta el backend |
| `npm test` | Pruebas del backend (`node --test`) |

## Variables de entorno

Backend (`backend/.env`):

- `PORT` (3001), `HOST` (0.0.0.0)
- `CORS_ORIGIN`: orígenes permitidos separados por coma (por defecto `http://localhost:5173`). Funciona por HTTP; incluye el origen completo, p. ej. `http://203.0.113.10`. Usa `*` para permitir cualquier origen
- `DATA_FILE`: ruta del JSON relativa a `backend/` (por defecto `data/clients.json`)

Frontend (`frontend/.env`):

- `VITE_API_URL`: URL base de la API. Local: `http://localhost:3001/api`. Con Nginx: `/api`.

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Verifica que la API está activa |
| GET | `/api/clients` | Lista todos los clientes |
| GET | `/api/clients/:id` | Obtiene un cliente |
| POST | `/api/clients` | Crea un cliente (201) |
| PUT | `/api/clients/:id` | Actualiza un cliente |
| DELETE | `/api/clients/:id` | Elimina un cliente (204) |

Cliente: `id` (UUID), `name`, `email`, `phone`, `company` (opcional), `createdAt` (ISO 8601). `name`, `email` y `phone` son obligatorios y el correo debe tener formato válido. Errores de validación: `400` con `{ "error": "...", "details": { "campo": "mensaje" } }`.

## Estructura

```
├── package.json          workspaces y scripts raíz
├── frontend/             React + Vite
│   └── src/              App.jsx, api.js, components/, styles.css
└── backend/              Express
    ├── data/clients.json datos (inicia como [])
    └── src/
        ├── index.js      arranque
        ├── app.js        middlewares, CORS, manejo de errores
        ├── config.js     variables de entorno
        ├── routes/       rutas /api/clients
        ├── store.js      lectura/escritura JSON con cola
        └── validate.js   validación de datos
```

## Persistencia

Solo el backend lee y escribe el JSON. Las escrituras pasan por una cola de promesas (una a la vez) y se guardan en un archivo temporal que luego se renombra, para evitar corrupción con solicitudes simultáneas. Si el archivo está dañado, la API responde `500` sin caerse.

## Despliegue en EC2 con Nginx (guía de referencia)

Pensado para Ubuntu (usa `sites-available`/`sites-enabled`). Esta guía es solo documentación: el repositorio no crea ni configura recursos de AWS. En el Security Group de la instancia abre el puerto 80 (HTTP). No abras el 3001.

### 1. Instalar Node.js y Nginx

```bash
sudo apt update
sudo apt install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo systemctl enable --now nginx
```

### 2. Instalar y construir la app

```bash
sudo mkdir -p /var/www && cd /var/www
sudo chown $USER: /var/www
git clone <URL_DEL_REPO> clients-crud && cd clients-crud
npm install
cp backend/.env.example backend/.env      # CORS_ORIGIN solo es necesario si el front usa otro origen
echo "VITE_API_URL=/api" > frontend/.env
npm run build                              # genera frontend/dist
```

### 3. Backend como servicio (systemd)

Crea `/etc/systemd/system/clients-api.service`:

```ini
[Unit]
Description=Clients CRUD API
After=network.target

[Service]
WorkingDirectory=/var/www/clients-crud/backend
ExecStart=/usr/bin/node src/index.js
Environment=PORT=3001
Environment=HOST=127.0.0.1
Restart=always
User=ubuntu

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now clients-api
curl http://127.0.0.1:3001/api/health
```

`HOST=127.0.0.1` hace que solo Nginx pueda llegar al backend. Ajusta `User` si tu usuario no es `ubuntu`; ese usuario debe poder escribir en `backend/data/`.

### 4. Sitio de Nginx

Crea `/etc/nginx/sites-available/clients-crud`:

```nginx
server {
    listen 80 default_server;
    server_name _;    # o tu dominio / IP pública

    root /var/www/clients-crud/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Actívalo y recarga:

```bash
sudo ln -s /etc/nginx/sites-available/clients-crud /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # evita conflicto con default_server
sudo nginx -t
sudo systemctl reload nginx
```

Abre `http://IP_PUBLICA`. Front y API salen del mismo origen, así que CORS no interviene. Si Nginx devuelve 403 o 500 al servir el front, verifica que el usuario `www-data` pueda leer `frontend/dist` y atravesar sus directorios padre.

### Actualizar la app

```bash
cd /var/www/clients-crud && git pull && npm install && npm run build
sudo systemctl restart clients-api
```
