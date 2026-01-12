# Railway Deployment Guide

Step-by-step guide to deploy PlayGolfSpainNow to Railway.

## Prerequisites

- ✅ GitHub repository (already done)
- ✅ Railway account (sign up at https://railway.app)
- ✅ Code is pushed to GitHub

## Step 1: Connect GitHub to Railway

1. Go to https://railway.app
2. Sign up or log in (you can use GitHub to sign up)
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Authorize Railway to access your GitHub repositories (if needed)
6. Select your repository: `playgolfnowspain/Golf-Sphere-AI` (or your repo name)

Railway will automatically:
- ✅ Detect Node.js from `package.json`
- ✅ Read build commands from `railway.json`
- ✅ Start building your app

## Step 2: Wait for First Build

- The first build takes 2-5 minutes
- You can watch the build logs in real-time
- Wait for "Build successful" message

## Step 3: Set Environment Variables

1. Click on your project/service in Railway dashboard
2. Go to the **"Variables"** tab
3. Click **"New Variable"** and add these:

### Required (for production):

```env
NODE_ENV=production
```

**Note:** Railway automatically sets `PORT`, so you don't need to set it manually.

### Optional (but recommended):

```env
# OpenAI (for chatbot)
OPENAI_API_KEY=your-openai-api-key-here

# Perplexity (backup AI provider)
PERPLEXITY_API_KEY=your-perplexity-api-key-here

# Database (optional - app works without it)
# DATABASE_URL=postgresql://... (Railway can provision a database if needed)
```

**Important:** 
- Your app works WITHOUT any of these - it will use mock data
- Add OpenAI API keys to enable the chatbot
- Database is optional (app uses mock storage by default)

## Step 4: Get Your Railway URL

1. Go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. Railway automatically generates a domain like: `your-app.up.railway.app`
4. Your app is now live! 🎉

**Test it:** Visit the Railway URL to make sure everything works.

## Step 5: Add Custom Domain (Optional)

If you want to use your domain (playgolfnowspain.com):

1. In **"Settings"** → **"Domains"**, click **"Custom Domain"**
2. Enter your domain: `playgolfnowspain.com`
3. Railway will show you DNS records to add

### DNS Configuration:

Go to your domain registrar and add:

**For root domain (playgolfnowspain.com):**
- Type: `CNAME` or `ALIAS`
- Name: `@` (or leave blank)
- Value: `your-app.up.railway.app` (Railway will provide the exact value)

**For www subdomain (www.playgolfnowspain.com):**
- Type: `CNAME`
- Name: `www`
- Value: `your-app.up.railway.app`

**Wait 5-15 minutes** for DNS to propagate, then your custom domain will work!

## Step 6: Verify Deployment

✅ **Check these:**

1. **Website loads**: Visit your Railway URL
2. **Homepage works**: Should see the landing page
3. **Chatbot works**: Click the chat icon (if OpenAI key is set)
4. **Booking page**: Navigate to /book (uses mock data)
5. **No errors**: Check Railway logs for any issues

## Troubleshooting

### Build fails?
- Check build logs in Railway
- Make sure `package.json` has all dependencies
- Verify `railway.json` is correct

### App won't start?
- Check deployment logs
- Verify `NODE_ENV=production` is set
- Check that PORT is set (Railway does this automatically)

### Custom domain not working?
- Wait 15-30 minutes for DNS propagation
- Verify DNS records are correct at your registrar
- Check Railway logs for domain errors

### Chatbot not working?
- Verify `OPENAI_API_KEY` is set in Railway variables
- Check logs for API errors
- App will show a message if API key is not configured

## Environment Variables Summary

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | ✅ Yes | Set to `production` |
| `PORT` | ❌ No | Railway sets this automatically |
| `OPENAI_API_KEY` | ❌ No | Enable chatbot (optional) |
| `PERPLEXITY_API_KEY` | ❌ No | Backup AI provider (optional) |
| `DATABASE_URL` | ❌ No | Database (optional, uses mock storage) |

## Cost

- **Free tier**: $5/month credit (good for testing)
- **Hobby plan**: $5/month (better for production)
- Check usage in Railway dashboard

## Next Steps After Deployment

1. ✅ Test all features
2. ✅ Set up custom domain (if needed)
3. ✅ Monitor logs and performance
4. ✅ Add more environment variables as needed
5. ✅ Share your live site! 🎉

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Contact: playgolfnowspain@gmail.com

