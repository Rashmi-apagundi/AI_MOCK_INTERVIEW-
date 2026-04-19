#!/bin/bash
set -e

echo "Updating Nginx configuration..."
cat << 'EOF' | sudo tee /etc/nginx/sites-available/default > /dev/null
server {
    listen 80;
    server_name 16.170.236.240.nip.io;

    root /home/ubuntu/ai-mock-interview/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        client_max_body_size 30M;
    }
}
EOF

echo "Testing Nginx configuration..."
sudo nginx -t

echo "Updating frontend environment..."
cd ~/ai-mock-interview/client
echo "VITE_API_URL=https://16.170.236.240.nip.io/api" > .env.production
npm run build

echo "Updating backend environment..."
cd ~/ai-mock-interview/server
sed -i 's|CLIENT_URL=.*|CLIENT_URL=https://16.170.236.240.nip.io|g' .env
pm2 restart mock-interview-api --update-env

echo "Installing Certbot..."
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx

echo "Provisioning SSL Certificate..."
sudo certbot --nginx -d 16.170.236.240.nip.io --non-interactive --agree-tos -m rashmi@example.com --redirect

echo "Done!"
