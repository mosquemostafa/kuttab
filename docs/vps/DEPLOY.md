# VPS Setup & Deployment Guide — Modawim

## Prerequisites on the VPS (one-time)

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker aanassar      # add your user to the docker group
newgrp docker                          # reload group without re-login

# 2. Install Docker Compose plugin (v2 — no separate binary needed)
sudo apt-get install -y docker-compose-plugin

# 3. Install Nginx
sudo apt-get install -y nginx

# 4. Install Certbot for Let's Encrypt SSL
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## 1. Authenticate Docker to GHCR (one-time per VPS)

Generate a GitHub **Personal Access Token (classic)** with the `read:packages` scope at
https://github.com/settings/tokens

```bash
echo "<YOUR_GITHUB_PAT>" | docker login ghcr.io -u abdelrahman-ahmed-nassar --password-stdin
```

Docker saves the credentials; you won't need to log in again.

---

## 2. Create the app directory on the VPS

```bash
mkdir -p ~/modawim
cd ~/modawim
```

Copy `docker-compose.yml` from this repo to `~/modawim/docker-compose.yml` (Note: subsequent GitHub Actions deployments will sync this file automatically).

---

## 3. Create the `.env` file on the VPS

```bash
nano ~/modawim/.env
```

Paste **all** environment variables required by `src/server/lib/env.ts`.
This file stays on the VPS only — it is never committed to git.

```env
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://modawim.com

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://modawim.com

# Database (Neon)
DATABASE_URL=postgres://...

# Email (Gmail SMTP)
GMAIL_FROM_EMAIL=...
GMAIL_FROM_NAME=Modawim
GMAIL_USER=...
GMAIL_APP_PASSWORD=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_ROOT_FOLDER=...

# Upstash Redis (optional — comment out both to disable)
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client (also needed at runtime for SSR)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...

# Analytics (optional)
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Sentry (optional)
# NEXT_PUBLIC_SENTRY_DSN=...
# SENTRY_ORG=...
# SENTRY_PROJECT=...
# SENTRY_AUTH_TOKEN=...

# Local Redis (for BullMQ queues)
REDIS_PASSWORD=your_strong_redis_password
REDIS_URL=redis://:your_strong_redis_password@redis:6379

# Newsletter (optional — omit all to disable)
# RESEND_API_KEY=...
# RESEND_FROM_EMAIL=...
# RESEND_FROM_NAME=Modawim
```

---

## 4. Set up Nginx

```bash
sudo cp /path/to/nginx/modawim.conf /etc/nginx/sites-available/modawim.conf
sudo ln -s /etc/nginx/sites-available/modawim.conf /etc/nginx/sites-enabled/
sudo nginx -t          # verify config
sudo systemctl reload nginx
```

---

## 5. Issue SSL certificate (first time)

# Before enabling this file:

# 1. Generate an Origin Certificate in Cloudflare:

# Cloudflare dashboard → modawim.com → SSL/TLS → Origin Server → Create Certificate

# Choose "Let Cloudflare generate a private key" and cover \*.modawim.com + modawim.com

# 2. Copy the two files onto the VPS:

# /etc/ssl/cloudflare/modawim.com.pem ← "Origin Certificate" (.pem Cloudflare shows)

# /etc/ssl/cloudflare/modawim.com.key ← "Private Key" (shown only once — save it!)

# 3. Lock down permissions:

# sudo mkdir -p /etc/ssl/cloudflare

# sudo chmod 644 /etc/ssl/cloudflare/modawim.com.pem

# sudo chmod 600 /etc/ssl/cloudflare/modawim.com.key

# 4. Link and reload:

# sudo ln -s /etc/nginx/sites-available/modawim.conf /etc/nginx/sites-enabled/

# sudo nginx -t && sudo systemctl reload nginx

---

## 6. Pull and start the container

```bash
cd ~/modawim

# Pull the latest image built by GitHub Actions
docker compose pull

# Start (detached)
docker compose up -d

# Verify it's healthy
docker compose ps
docker compose logs -f modawim-app
```

---

## 7. Updating after a new build

After GitHub Actions pushes a new image (on every push to `main`), log into the VPS and run:

```bash
cd ~/modawim
docker compose pull          # fetch the new :latest
docker compose up -d         # recreate the container with zero-downtime restart
docker image prune -f        # clean up old dangling images
```

---

## GitHub Actions secrets to add

Go to: `https://github.com/abdelrahman-ahmed-nassar/modawim/settings/secrets/actions`

Add each of these as a **repository secret** (they are passed as Docker build-args so
Next.js can bake them into the client bundle):

| Secret name                                | Value                          |
| ------------------------------------------ | ------------------------------ |
| `NEXT_PUBLIC_APP_URL`                      | `https://modawim.com`          |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | your Firebase key              |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | your Firebase project ID       |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `your-project.appspot.com`     |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | your sender ID                 |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | your app ID                    |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`           | your VAPID key                 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`            | _(optional)_ `G-XXXXXXXXXX`    |
| `NEXT_PUBLIC_SENTRY_DSN`                   | _(optional)_                   |

> **GITHUB_TOKEN** is injected automatically by Actions — you do NOT add it manually.
