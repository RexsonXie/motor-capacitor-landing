# Google Ads Landing Page - Vercel Deployment Guide

## 📁 Project Structure

```
landpages/
├── index.html              # Main landing page
├── thank-you.html          # Thank you page
├── api/
│   └── submit-inquiry.js   # Vercel Serverless Function (form handler)
├── vercel.json             # Vercel configuration
└── README.md               # This file
```

## 🚀 How to Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd C:\codes\landpages
   vercel
   ```

4. **Follow the prompts**
   - Set up and deploy? **Y**
   - Which scope? (select your account)
   - Link to existing project? **N**
   - Project name: **motor-capacitor-landing** (or your choice)
   - In which directory is your code? **.** (current directory)
   - Override settings? **N**

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Connect your GitHub repository (or upload files)
4. Vercel will automatically detect the configuration
5. Click **"Deploy"**

## ✅ What Happens After Deployment

1. **Form Submission Flow:**
   - User fills out form → Click "Send Inquiry Now"
   - Frontend sends data to `/api/submit-inquiry`
   - Vercel Serverless Function processes the request
   - Email sent via Resend API to: `sales@eperscapacitor.com`
   - User redirected to `thank-you.html`

2. **Email Format:**
   - **From:** noreply@eperscapacitor.com
   - **To:** sales@eperscapacitor.com
   - **Reply-To:** [customer's email]
   - **Subject:** New Inquiry: [Name] from [Company]

## 🔧 Configuration Files

### api/submit-inquiry.js
- Handles POST requests from the form
- Validates input data
- Sends formatted HTML email via Resend API
- Uses environment variables for sensitive data

### vercel.json
- Configures Vercel to handle API routes
- Maps `/api/*` requests to the `api/` folder

## 🔑 Required Environment Variables

Configure these in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Your Resend.com API key | `re_xxxxxxxxxxxx` |
| `TO_EMAIL` | Recipient email address | `sales@yourdomain.com` |
| `FROM_EMAIL` | Sender email address (optional) | `noreply@yourdomain.com` |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins (optional) | `https://yourdomain.com` |

**Note:** If `ALLOWED_ORIGINS` is not set, CORS will allow all origins (`*`).

## 📧 Email Settings (Resend)

- **Service:** Resend.com
- **API Key:** Configure in Vercel Environment Variables (RESEND_API_KEY)
- **Sender:** noreply@eperscapacitor.com (configurable via FROM_EMAIL)
- **Recipient:** sales@eperscapacitor.com (configurable via TO_EMAIL)

## ⚠️ Important Notes

1. **Domain Configuration:**
   - To send emails from `@eperscapacitor.com`, you need to verify your domain in Resend
   - Go to Resend Dashboard → Domains → Add Domain
   - Add `eperscapacitor.com` and follow the DNS instructions

2. **Resend Free Tier:**
   - 3,000 emails per month
   - Enough for most landing pages

3. **Testing:**
   - After deployment, test the form to ensure emails are received
   - Check spam folder if email doesn't arrive

## 🌐 Custom Domain (Optional)

To use a custom domain:

1. In Vercel Dashboard → Project Settings → Domains
2. Add your domain (e.g., `inquiry.eperscapacitor.com`)
3. Update DNS records as instructed by Vercel
4. Wait for SSL certificate to be issued

## 📊 Google Ads Tracking

Remember to replace these placeholders in `index.html`:

- `G-XXXXXXXXXX` → Your GA4 Measurement ID
- `AW-123456789` → Your Google Ads Conversion ID
- `abcdefg1234567890` → Your Conversion Label

## 🐛 Troubleshooting

**Form not submitting?**
- Check browser console for errors
- Verify API route is working: `https://your-domain.vercel.app/api/submit-inquiry`

**Email not received?**
- Check Resend Dashboard for delivery status
- Verify domain is verified in Resend
- Check spam folder

**API returns 404?**
- Ensure `vercel.json` is in root directory
- Ensure `api/` folder is at the same level as `index.html`

## 📞 Support

For issues with:
- **Vercel Deployment:** https://vercel.com/docs
- **Resend Email:** https://resend.com/docs
- **Domain Setup:** Contact your domain provider
