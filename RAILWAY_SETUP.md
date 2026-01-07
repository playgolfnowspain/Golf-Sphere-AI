# Railway Deployment - Step by Step Guide

Follow these steps to deploy PlayGolfSpainNow to Railway.

## Step 1: Create Railway Account

1. Go to **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Sign up/login with your **GitHub account** (recommended for easy repo connection)

## Step 2: Deploy from GitHub

1. Once logged in, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub repositories if prompted
4. Find and select **`playgolfnowspain/Golf-Sphere-AI`** repository
5. Railway will automatically detect it's a Node.js project

## Step 3: Railway Auto-Configuration

Railway will automatically:
- ✅ Detect Node.js from `package.json`
- ✅ Read build commands from `railway.json`
- ✅ Start deploying your app

**Wait for the first deployment to complete** (takes ~2-3 minutes)

## Step 4: Set Environment Variables

1. Click on your project/service in Railway dashboard
2. Go to **"Variables"** tab
3. Click **"New Variable"** and add these:

### Required:
```
NODE_ENV=production
```

**Note:** Railway automatically sets `PORT`, so you don't need to set it manually.

### Optional (for full functionality):
```
OPENAI_API_KEY=sk-your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1

GOLFNOW_API_KEY=your-golfnow-key
GOLFNOW_AFFILIATE_ID=your-affiliate-id
GOLFNOW_BASE_URL=https://api.golfnow.com/v1

DATABASE_URL=postgresql://... (Railway can provision a database if needed)
```

**The app works without these** - it will use mock data for bookings if GolfNow keys aren't set, and the chatbot will show a message if OpenAI isn't configured.

## Step 5: Get Your Railway Domain

1. Go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. Railway automatically generates a domain like: `your-app.up.railway.app`
4. Copy this URL - your app is live!

**Test it:** Visit the URL to make sure everything works.

## Step 6: Add Custom Domain (Your Domain)

1. In **"Settings"** → **"Domains"**, click **"Custom Domain"**
2. Enter your domain (e.g., `playgolfspainnow.com`)
3. Railway will show you DNS records to add

### DNS Configuration:

Go to your domain registrar (where you bought the domain) and add:

**For root domain (example.com):**
- Type: `CNAME` or `ALIAS`
- Name: `@` (or leave blank)
- Value: `your-app.up.railway.app` (or Railway will provide the exact value)

**For www subdomain (www.example.com):**
- Type: `CNAME`
- Name: `www`
- Value: `your-app.up.railway.app`

**Wait 5-15 minutes** for DNS to propagate, then your custom domain will work!

## Step 7: Enable HTTPS (Automatic)

Railway automatically provides SSL/HTTPS certificates for your domain. No action needed - just wait for DNS to propagate.

## Step 8: Monitor Your App

1. **Logs:** Click "Deployments" tab to see logs
2. **Metrics:** See CPU, RAM usage in the dashboard
3. **Redeploy:** Push to GitHub main branch = automatic redeploy

## Troubleshooting

### App won't start?
- Check **"Deployments"** tab for error logs
- Verify environment variables are set correctly
- Make sure `NODE_ENV=production` is set

### Custom domain not working?
- Wait 15-30 minutes for DNS propagation
- Verify DNS records are correct in your registrar
- Check Railway logs for domain errors

### Out of credits?
- Free tier: $1/month (good for testing)
- Upgrade to Hobby plan ($5/month) for production
- Check usage in Railway dashboard

## That's It! 🎉

Your app should now be live at:
- Railway domain: `your-app.up.railway.app`
- Your domain: `yourdomain.com` (after DNS setup)

## Next Steps

1. ✅ Test all features (chatbot, booking, newsletter)
2. ✅ Share your live site!
3. ✅ Monitor usage on Railway dashboard
4. ✅ Upgrade plan if you get traffic

---

**Need Help?** Email: playgolfnowspain@gmail.com

