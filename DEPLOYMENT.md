# Deployment Guide

This guide will help you deploy PlayGolfSpainNow to your custom domain.

## Quick Deploy Options

### Option 1: Railway (Recommended - Easy & Free Tier Available)
Railway is great for full-stack Node.js apps with databases.

**Steps:**
1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `Golf-Sphere-AI` repository
5. Railway will auto-detect the Node.js app
6. Add environment variables (see below)
7. Go to Settings → Generate Domain (or use your custom domain)
8. Add your custom domain in Settings → Domains

**Environment Variables to Set:**
```
PORT=5000
NODE_ENV=production
DATABASE_URL=your_postgres_url (Railway can provision one)
OPENAI_API_KEY=your_openai_key (optional - for chat + article agent)
OPENAI_BASE_URL=https://api.openai.com/v1 (optional)
PERPLEXITY_API_KEY=your_perplexity_key (optional)
AI_PROVIDER=openai (optional)
GOLFNOW_USERNAME=your_golfnow_username (optional - for real bookings)
GOLFNOW_PASSWORD=your_golfnow_password (optional)
GOLFNOW_CHANNEL_ID=your_golfnow_channel_id (optional)
GOLFNOW_AFFILIATE_ID=your_affiliate_id (optional)
ARTICLE_AGENT_CRON=0 6 * * * (optional)
ARTICLE_AGENT_TZ=Europe/Madrid (optional)
```

### Option 2: Render
Similar to Railway, good for Node.js apps.

**Steps:**
1. Go to https://render.com
2. Connect GitHub account
3. New → Web Service
4. Select repository
5. Settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node
6. Add environment variables
7. Add custom domain in Settings

### Option 3: Fly.io
Great for global deployment with your own domain.

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch`
3. Follow prompts
4. Add your domain: `fly domains add yourdomain.com`

### Option 4: DigitalOcean App Platform
Professional hosting with simple setup.

**Steps:**
1. Go to https://cloud.digitalocean.com/apps
2. Create App → GitHub
3. Select repository
4. Configure build and run commands
5. Add custom domain

## DNS Configuration

After deploying, you'll need to configure DNS for your domain:

1. **Get your deployment URL/IP** from your hosting provider
2. **Update DNS records** in your domain registrar:

   **For Railway/Render/Fly.io:**
   - Add CNAME record: `www` → `your-app.railway.app` (or provider URL)
   - Add CNAME record: `@` → `your-app.railway.app` (for root domain)

   **For custom server:**
   - Add A record: `@` → your server IP
   - Add A record: `www` → your server IP

## Environment Variables

Set these in your hosting platform:

### Required for Production:
```bash
NODE_ENV=production
PORT=5000  # Or whatever port your host assigns
```

### Database (if using real database):
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### AI Providers (chat + article agent):
```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
PERPLEXITY_API_KEY=pplx-...
AI_PROVIDER=openai
```

### Article Agent (daily auto-article):
```bash
ARTICLE_AGENT_ENABLED=true
ARTICLE_AGENT_CRON=0 6 * * *  # 6:00 AM daily
ARTICLE_AGENT_TZ=Europe/Madrid
ARTICLE_AGENT_TOKEN=your_secret_token  # optional for manual trigger
ARTICLE_AGENT_BOOTSTRAP_ON_STARTUP=true  # generate batch on deploy
ARTICLE_AGENT_TOPICS=Costa del Sol golf courses|Mallorca golf week itinerary|Barcelona and Girona golf itinerary|Canary Islands winter golf guide|Hidden gems in Spain for golf travelers
```

### GolfNow (for real bookings):
```bash
GOLFNOW_USERNAME=your_username
GOLFNOW_PASSWORD=your_password
GOLFNOW_CHANNEL_ID=your_channel_id
GOLFNOW_AFFILIATE_ID=your_id
GOLFNOW_BASE_URL=https://sandbox.api.gnsvc.com/rest
```

## Build & Deploy

The app is ready to deploy:
- Build command: `npm run build`
- Start command: `npm start`
- Output: `dist/` folder with bundled server + client

## Post-Deployment

1. **Test your site** on the custom domain
2. **Verify SSL/HTTPS** is enabled (most hosts do this automatically)
3. **Test chatbot** and booking flows
4. **Monitor logs** for any issues

## Need Help?

Contact: playgolfnowspain@gmail.com

