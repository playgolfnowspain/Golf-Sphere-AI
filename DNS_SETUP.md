# DNS Configuration for playgolfspainnow.com

## DNS Records to Add

Add these records at your domain registrar:

### Record 1: Root Domain (playgolfspainnow.com)

**Option A - If your registrar supports CNAME for root domain:**
- **Type:** `CNAME` or `ALIAS`
- **Name/Host:** `@` (or leave blank, or enter `playgolfspainnow.com`)
- **Value/Target:** `uvfsnsds.up.railway.app`
- **TTL:** 3600 (or default)

**Option B - If your registrar doesn't support CNAME on root (common):**
- **Type:** `ALIAS` or `ANAME` (if available)
- **Name/Host:** `@` (or blank)
- **Value/Target:** `uvfsnsds.up.railway.app`

**Option C - If only A records allowed:**
You'll need to get Railway's IP address. Contact Railway support or use a DNS lookup tool to find the IP of `uvfsnsds.up.railway.app`.

### Record 2: WWW Subdomain (www.playgolfspainnow.com)

- **Type:** `CNAME`
- **Name/Host:** `www`
- **Value/Target:** `uvfsnsds.up.railway.app`
- **TTL:** 3600 (or default)

## Step-by-Step Instructions by Registrar

### GoDaddy
1. Log in → My Products → DNS
2. Scroll to "Records" section
3. Click "Add" → Select Type
4. Add both records above
5. Save

### Namecheap
1. Log in → Domain List → Manage → Advanced DNS
2. Click "Add New Record"
3. Add both records above
4. Save All Changes

### Google Domains
1. Log in → DNS → Custom records
2. Click "Manage custom records"
3. Add both records above
4. Save

### Cloudflare
1. Log in → Select domain → DNS → Records
2. Click "Add record"
3. Add both records above
4. Make sure Proxy is OFF (orange cloud) for initial setup
5. Save

### Generic Instructions
1. Find "DNS Management" or "DNS Settings" in your domain registrar
2. Look for "DNS Records" or "Manage DNS"
3. Add the records listed above
4. Save changes

## After Adding DNS Records

1. **Wait for propagation:** 5 minutes to 72 hours (usually 15-30 minutes)
2. **Check status in Railway:** Go back to Railway dashboard → Settings → Domains
3. **You'll see "Active" when DNS is properly configured**
4. **Test:** Visit `https://playgolfspainnow.com` (HTTPS is automatic)

## Verify DNS is Working

You can check if DNS is configured correctly:

```bash
# Check root domain
dig playgolfspainnow.com

# Check www subdomain
dig www.playgolfspainnow.com
```

Both should point to Railway's infrastructure.

## Troubleshooting

### "Record not yet detected" in Railway
- Wait 15-30 minutes after adding DNS records
- Check that records are saved at your registrar
- Verify no typos in the CNAME value
- Clear your browser cache and try again

### Domain not resolving
- Double-check the CNAME value matches exactly: `uvfsnsds.up.railway.app`
- Ensure no conflicting records (remove old A records for @ if they exist)
- Wait longer for DNS propagation

### Can't add CNAME for root domain
- Use ALIAS/ANAME if your registrar supports it
- Some registrars require A records - you may need to contact Railway support for an IP address

## Important Notes

✅ Railway automatically provides SSL/HTTPS certificates  
✅ Both `playgolfspainnow.com` and `www.playgolfspainnow.com` will work  
✅ DNS changes can take time - be patient!  
✅ Railway dashboard will show when the domain is active

---

**Railway CNAME Target:** `uvfsnsds.up.railway.app`  
**Domain:** `playgolfspainnow.com`

