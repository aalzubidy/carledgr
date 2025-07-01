# Email Deliverability Guide for CarLedgr

## ⚡ 2024 Gmail/Yahoo Requirements (NEW)

### MANDATORY for Gmail & Yahoo Delivery:
1. **DMARC Authentication** - Manual setup required (SPF/DKIM auto-setup with Resend)
2. **One-Click Unsubscribe** - URL-based unsubscribe headers (✅ implemented)
3. **Spam Rate < 0.3%** - Monitor complaint rates (< 0.08% for Resend)
4. **Bounce Rate < 4%** - Clean email lists regularly
5. **Domain Alignment** - All links must match sending domain
6. **No "no-reply" addresses** - Use monitored addresses

### ✅ Already Implemented:
- One-click unsubscribe headers (`List-Unsubscribe-Post`)
- URL and email unsubscribe options
- Professional email templates
- Plain text versions
- Proper authentication headers
- Environment tagging for analytics

## 🚨 Common Issues & Solutions

### Why Emails Go to Spam
1. **Missing DNS Authentication** (SPF, DKIM, DMARC)
2. **Poor sender reputation**
3. **Spam trigger words** in subject/content
4. **No text version** of email
5. **Generic "noreply" addresses**

## 🔧 Quick Fixes Applied

### Code Improvements
- ✅ **Better subject line**: Changed "Password Reset" → "Account Access Credentials"
- ✅ **Improved content**: Less "spammy" language
- ✅ **Added text version**: All emails now include plain text
- ✅ **Better headers**: Added authentication headers
- ✅ **Proper email structure**: Professional HTML with fallbacks

### Configuration Required

#### 1. **DNS Records Setup** (CRITICAL)

Add these DNS records to your domain:

```bash
# SPF Record (TXT record)
Name: yourdomain.com
Type: TXT
Value: "v=spf1 include:_spf.resend.com ~all"

# DKIM Record (Get from Resend dashboard)
Name: [provided by Resend]
Type: TXT  
Value: [provided by Resend]

# DMARC Record
Name: _dmarc.yourdomain.com
Type: TXT
Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

#### 2. **Email Provider Setup**

**Option A: Resend (Recommended)**
```json
{
  "email": {
    "provider": "resend",
    "resendApiKey": "re_your_api_key",
    "fromEmail": "noreply@yourdomain.com",
    "fromName": "CarLedgr Support"
  }
}
```

**Option B: Professional SMTP**
```json
{
  "email": {
    "provider": "smtp",
    "fromEmail": "support@yourdomain.com", 
    "fromName": "CarLedgr Support",
    "smtp": {
      "host": "smtp.yourdomain.com",
      "port": 587,
      "secure": false,
      "user": "support@yourdomain.com",
      "password": "your_password"
    }
  }
}
```

#### 3. **Domain Requirements**

- ✅ **Use your own domain** (not Gmail/Yahoo)
- ✅ **Professional email address** (support@, noreply@)
- ✅ **Dedicated IP** (for high volume)
- ✅ **Domain warmup** (start with low volume)

## 📊 Testing & Monitoring

### Test Email Deliverability
1. **Mail-tester.com**: Test spam score
2. **MXToolbox**: Check DNS records
3. **Resend Analytics**: Monitor delivery rates
4. **Gmail Postmaster**: Monitor reputation

### Monitor Performance
```bash
# Check delivery rates in Resend dashboard
# Monitor bounce rates < 5%
# Monitor complaint rates < 0.1%
# Monitor spam rates < 0.1%
```

## 🎯 Best Practices

### Content Guidelines
- ✅ **Avoid spam words**: "Free", "Urgent", "Act Now"
- ✅ **Professional language**: Clear, concise
- ✅ **Proper HTML structure**: Valid, accessible
- ✅ **Text alternatives**: Always include plain text

### Sending Practices
- ✅ **Consistent sending**: Regular schedule
- ✅ **Clean lists**: Remove bounces/complaints
- ✅ **Gradual ramp-up**: Increase volume slowly
- ✅ **Monitor feedback**: Watch spam reports

### Technical Setup
- ✅ **DNS authentication**: SPF, DKIM, DMARC
- ✅ **Reverse DNS**: PTR record setup
- ✅ **IP reputation**: Monitor blacklists
- ✅ **Headers**: Proper message headers

## 🚀 Implementation Steps

### Immediate (Do Now)
1. **Update DNS records** with SPF, DKIM, DMARC
2. **Switch to professional email service** (Resend/SendGrid)
3. **Use your domain** for from address
4. **Deploy updated code** with improvements

### Short Term (This Week)
1. **Monitor delivery rates** in email service dashboard
2. **Test with mail-tester.com** 
3. **Set up domain authentication** in email service
4. **Create unsubscribe handling** (if needed)

### Long Term (Ongoing)
1. **Monitor sender reputation**
2. **Maintain clean email lists**
3. **Regular deliverability testing**
4. **Domain/IP warmup** for new domains

## 📞 Support Resources

- **Resend Docs**: https://resend.com/docs
- **Email Deliverability Guide**: https://sendgrid.com/blog/deliverability/
- **DNS Check Tool**: https://mxtoolbox.com/
- **Spam Test Tool**: https://mail-tester.com/

## 🔍 Troubleshooting

### Still Going to Spam?
1. **Check DNS records** are properly set
2. **Verify domain ownership** in email service
3. **Review content** for spam triggers
4. **Check sender reputation** tools
5. **Contact email provider** support

### Common Issues
- **DNS propagation**: Can take 24-48 hours
- **Domain reputation**: New domains need warmup
- **Content triggers**: Avoid promotional language
- **Volume spike**: Sudden increases trigger filters 