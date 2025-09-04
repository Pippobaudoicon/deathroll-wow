# 🎮 Deathroll WoW - Production Deployment Guide

## Prerequisites
- Node.js installed on your server
- PM2 installed globally (`npm install -g pm2`)
- Nginx configured and running
- Domain name pointing to your server
- SSL certificate (recommended)

## Quick Deployment Steps

### 1. Update Configuration Files

**Update `ecosystem.config.js`:**
```bash
# Edit the ecosystem.config.js file
nano ecosystem.config.js
```
- Change `/path/to/your/deathroll-wow` to your actual project path
- Update `CORS_ORIGIN` with your actual domain

**Update Client Configuration:**
```bash
# Edit the client environment config
nano client/src/config/env.js
```
- Replace `https://your-domain.com` with your actual domain

### 2. Build the Client
```bash
cd client
npm install
npm run build
cd ..
```

### 3. Deploy with PM2
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 4. Setup PM2 Auto-Startup
```bash
# Generate startup script
pm2 startup

# Follow the generated command (usually something like):
# sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u youruser --hp /home/youruser

# Save current PM2 processes
pm2 save
```

### 5. Configure Nginx

**Example Nginx configuration (`/etc/nginx/sites-available/deathroll-wow`):**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (add your SSL certificate paths)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Serve built client files
    root /path/to/your/deathroll-wow/client/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js server
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy Socket.IO connections
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/deathroll-wow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Useful PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs deathroll-wow-server

# Restart application
pm2 restart deathroll-wow-server

# Stop application
pm2 stop deathroll-wow-server

# Monitor processes
pm2 monit

# View process details
pm2 describe deathroll-wow-server
```

## Environment Variables

The application supports these environment variables:

- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Allowed CORS origin (your domain)

## Troubleshooting

### Check if server is running:
```bash
curl http://localhost:3001/api/health
```

### Check Socket.IO connection:
```bash
# Should return Socket.IO response
curl http://localhost:3001/socket.io/
```

### View server logs:
```bash
pm2 logs deathroll-wow-server --lines 100
```

### Restart if needed:
```bash
pm2 restart deathroll-wow-server
```

## Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Firewall configured (only allow 80, 443, SSH)
- [ ] PM2 running as non-root user
- [ ] Nginx security headers configured
- [ ] Server dependencies updated
- [ ] CORS origins properly restricted

## Monitoring

Consider setting up monitoring:
- PM2 Plus for process monitoring
- Log rotation for application logs
- Health check endpoints
- Server resource monitoring

Your Deathroll WoW application should now be running in production! 🚀
