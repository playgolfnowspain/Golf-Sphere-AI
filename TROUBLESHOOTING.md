# Troubleshooting: Website Not Live

## Step 1: Check Railway Deployment Status

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Check if your project is deployed:
   - Is there a service running?
   - Are there any build errors?
   - Check the "Deployments" tab for failed builds
   - Check the "Logs" tab for error messages

## Step 2: Verify Railway Service is Running

In Railway dashboard:
- Service should show as "Active" or "Running"
- Check the logs for startup errors
- Verify the service is listening on the PORT (Railway sets this automatically)

## Step 3: Check Custom Domain Setup in Railway

1. In Railway dashboard → Your Service → Settings → Networking
2. Verify custom domain is added:
   - Domain: `playgolfspainnow.com`
   - Status should show as "Active" or "Pending"
3. If domain shows as "Pending", check:
   - DNS records are correctly configured
   - DNS has propagated (can take up to 72 hours, usually 15-30 min)

## Step 4: Verify DNS Records

Run these commands to check DNS:

```bash
# Check root domain A record
dig playgolfspainnow.com A +short

# Check www CNAME record
dig www.playgolfspainnow.com CNAME +short

# Check if Railway URL resolves
dig 6kecmze6.up.railway.app A +short
```

## Step 5: Common Issues

### Issue: Railway build fails
**Solution:** Check build logs in Railway for errors. Common causes:
- Missing dependencies
- Build script errors
- TypeScript errors

### Issue: Railway service won't start
**Solution:** Check startup logs. Common causes:
- PORT environment variable not set (Railway sets this automatically)
- Database connection errors (check DATABASE_URL)
- Missing environment variables

### Issue: Domain shows "Pending" in Railway
**Solution:** 
- Wait 15-30 minutes for DNS propagation
- Verify DNS records are correct
- Railway will show DNS verification status

### Issue: 502 Bad Gateway / Connection Error
**Solution:**
- Service might not be running
- Check Railway logs for crashes
- Verify PORT is set (Railway does this automatically)

### Issue: Domain not resolving
**Solution:**
- Check DNS records are correct
- Wait for DNS propagation (up to 72 hours)
- Verify domain is added in Railway

## Step 6: Test Railway URL Directly

Before testing custom domain, test the Railway URL directly:
- Go to Railway dashboard → Your Service → Settings → Networking
- Click on the Railway-generated URL (e.g., `6kecmze6.up.railway.app`)
- If this works but custom domain doesn't, it's a DNS issue
- If this doesn't work, it's a Railway deployment issue

## What to Check First

1. **Is your service deployed and running in Railway?**
2. **What error do you see when visiting the website?** (502, DNS error, timeout, etc.)
3. **Does the Railway URL work?** (e.g., `6kecmze6.up.railway.app`)
4. **What does Railway show in the logs?**

