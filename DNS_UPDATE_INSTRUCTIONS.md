# DNS Update Instructions for playgolfspainnow.com

## Current DNS Records

✅ **www** CNAME → `6kecmze6.up.railway.app` (CORRECT - Keep this!)
✅ **mail** A → `213.145.228.111` (Keep for email)
✅ **@** MX → `mail.playgolfnowspain.com` (Keep for email)

❌ **@** A → `216.24.57.1` (NEEDS TO BE CHANGED)

## What to Change

### Update the Root Domain A Record

**Change this record:**
- Current: `@` A record → `216.24.57.1`
- **New:** `@` A record → `66.33.22.22` (Railway's IP)

**Steps:**
1. Find the `@` A record (currently pointing to `216.24.57.1`)
2. Click "Edit" or the edit icon
3. Change the IPv4 address from `216.24.57.1` to `66.33.22.22`
4. Save the changes

### Keep These Records (Don't Change)

✅ `www` CNAME → `6kecmze6.up.railway.app` (Already correct!)
✅ `mail` A → `213.145.228.111` (Keep for email)
✅ `@` MX → `mail.playgolfnowspain.com` (Keep for email)

## After Updating

1. **Wait 15-30 minutes** for DNS propagation
2. **Check Railway dashboard** - domain should show as "Active"
3. **Test:** Visit `https://playgolfspainnow.com` and `https://www.playgolfspainnow.com`

## Both Domains Will Work

After this change:
- ✅ `playgolfspainnow.com` → Will work (via A record)
- ✅ `www.playgolfspainnow.com` → Will work (via CNAME)
- ✅ Email will still work (MX and mail records unchanged)


