# Proxmox Self-Hosting Guide for NextGenGames.gg & Board Brawl

This guide details how to deploy **NextGenGames.gg** and **Board Brawl** on your Proxmox server using Docker, with automatic SSL, WebSocket upgrades, and persistent SQLite storage.

---

## 1. Quick Deploy on Proxmox (LXC or VM)

### A. Clone or Copy Files to Proxmox
Create a directory on your Proxmox Docker host:
```bash
mkdir -p /opt/nextgengames
cd /opt/nextgengames
```
Copy the project files or pull your Git repository:
```bash
git clone <your-repo-url> .
```

### B. Launch with Docker Compose
```bash
docker compose up -d --build
```
Your NextGenGames container will start on port `3000`. Persistent database data is saved to `/opt/nextgengames/data/nextgengames.db`.

---

## 2. Reverse Proxy Configurations for `nextgengames.gg`

Board Brawl requires WebSocket upgrades for real-time multiplayer, dice rolls, and tomato splats.

### Option A: Caddy (Recommended - Instant HTTPS & WebSockets)
Add this block to your `/etc/caddy/Caddyfile`:

```caddy
nextgengames.gg {
    reverse_proxy 127.0.0.1:3000
}
```
Reload Caddy:
```bash
caddy reload
```

### Option B: Nginx or Nginx Proxy Manager (NPM)
If using standard Nginx, add to `/etc/nginx/sites-available/nextgengames.gg`:

```nginx
server {
    server_name nextgengames.gg www.nextgengames.gg;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Certbot SSL configuration will append here automatically
    listen 80;
}
```
Enable and reload:
```bash
ln -s /etc/nginx/sites-available/nextgengames.gg /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d nextgengames.gg -d www.nextgengames.gg
```

### Option C: Cloudflare Tunnel (Zero Port-Forwarding)
In Cloudflare Zero Trust:
1. Create a Public Hostname for `nextgengames.gg`.
2. Service Type: `HTTP`
3. URL: `localhost:3000`
4. In **Additional application settings** -> **HTTP Settings**, enable **WebSockets**.

---

## 3. Backups & Maintenance
To back up all registered user accounts, friend lists, and stats:
```bash
cp /opt/nextgengames/data/nextgengames.db /opt/backups/nextgengames-$(date +%F).db
```
Zero downtime, self-contained, and lightweight.
