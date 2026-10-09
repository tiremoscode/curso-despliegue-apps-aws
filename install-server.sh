set -e

# Actualizar paquetes e instalar Nginx y PHP 8.5-FPM
sudo apt update
sudo apt install -y nginx php8.5-fpm

# Habilitar e iniciar servicios
sudo systemctl enable --now nginx
sudo systemctl enable --now php8.5-fpm

# Crear página PHP de prueba
sudo tee /var/www/html/index.php > /dev/null <<'PHP'
<?php
echo "Hola alumnos!<br>";

$a = 5;
$b = 5;

echo "Suma: " . ($a + $b) . "<br>";
?>
PHP

# Asignar permisos
sudo chown www-data:www-data /var/www/html/index.php
sudo chmod 644 /var/www/html/index.php
sudo rm /var/www/html/index.nginx-debian.html
sudo chmod 755 /var/www /var/www/html

# Configurar Nginx para procesar PHP con PHP-FPM 8.5
sudo tee /etc/nginx/sites-available/default > /dev/null <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.php index.html index.htm;
    server_name _;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
NGINX

# Validar y recargar Nginx
sudo nginx -t
sudo systemctl reload nginx

# Probar en la instancia
curl -i http://localhost/