# Google Search Console Verification Guide

## Method 1: HTML File Upload (Recommended)
1. Google will provide an HTML verification file (e.g., `google1234567890abcdef.html`)
2. Download this file
3. Upload it to your website root: `/home/aj/Documents/Projects/carledgr/website/`
4. Make sure it's accessible at: `https://carledgr.com/google1234567890abcdef.html`
5. Click "Verify" in Google Search Console

## Method 2: HTML Meta Tag (Alternative)
1. Google will provide a meta tag like:
   `<meta name="google-site-verification" content="abc123xyz" />`
2. Add this to the <head> section of your index.html
3. Deploy the changes
4. Click "Verify"

## Method 3: Google Analytics (If Already Connected)
1. If you're already using Google Analytics (you are!)
2. Google can verify through your existing GA property
3. Just select this option and click "Verify"

## After Verification
1. Submit your sitemap: `https://carledgr.com/sitemap.xml`
2. Submit your robots.txt for review
3. Monitor indexing status
4. Check for crawl errors 