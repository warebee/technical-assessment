# Deployment Guide - Markform-Based Implementation Role Assessment

This guide covers deployment of the new Markform-based assessment system with three role levels (Junior, Mid, Senior).

## System Overview

The application now uses:
- **Markform** for form definitions (`.form.md` files)
- **Next.js 14** with App Router
- **Resend** for email delivery
- **React Email** for email templates
- **Auto-save** using localStorage

## Quick Deploy to Vercel (Recommended)

### 1. Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
# or
bun add -g vercel
```

### 2. Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Add your credentials:

```env
# Resend API Configuration
RESEND_API_KEY=re_your_actual_api_key_here

# Email Configuration
ASSESSMENT_EMAIL_TO=hiring@yourcompany.com
ASSESSMENT_EMAIL_FROM=assessments@yourcompany.com
```

**Important:** `ASSESSMENT_EMAIL_FROM` must use a verified domain in Resend.

### 3. Deploy

From the project directory:

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- Project name? **implementation-assessment** (or your choice)
- Directory? **.** (current directory)
- Override settings? **N**

### 4. Add Environment Variables in Vercel

Go to your Vercel project dashboard:
- Settings → Environment Variables

Add:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
ASSESSMENT_EMAIL_TO=hiring@yourcompany.com
ASSESSMENT_EMAIL_FROM=assessments@yourcompany.com
```

### 5. Deploy to Production

```bash
vercel --prod
```

Your app is now live! Access routes:
- `/` - Landing page (role selection)
- `/assessment/junior` - Junior assessment
- `/assessment/mid` - Mid-level assessment
- `/assessment/senior` - Senior assessment

## Alternative: Deploy to Cloudflare Pages

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sql-assessment.git
git push -u origin main
```

### 2. Connect Cloudflare Pages

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project" → "Connect to Git"
3. Select your repository

### 3. Configure Build Settings

- **Build command**: `bun run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (leave default)

### 4. Add Environment Variables

In Cloudflare Pages → Settings → Environment Variables:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=work@warebee.com
```

### 5. Deploy

Click "Save and Deploy"

## Email Service Setup (Resend Required)

The new system uses **Resend** exclusively for email delivery with React Email templates.

### 1. Create Resend Account

1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys → Create API Key
3. Copy the key (starts with `re_`)

### 2. Verify Your Domain

For production use, verify your domain:
1. Resend Dashboard → Domains → Add Domain
2. Add your domain (e.g., `yourcompany.com`)
3. Add the provided DNS records to your domain
4. Wait for verification (usually 1-2 minutes)

For testing, you can use `onboarding@resend.dev` as the from address.

### 3. Configure Environment Variables

Add to `.env.local` (local) or Vercel dashboard (production):

```env
RESEND_API_KEY=re_your_api_key_here
ASSESSMENT_EMAIL_TO=hiring@yourcompany.com
ASSESSMENT_EMAIL_FROM=assessments@yourcompany.com
```

**Note:** `ASSESSMENT_EMAIL_FROM` must use your verified domain or `onboarding@resend.dev` for testing.

## Verifying Email Delivery

### Test Locally First

```bash
# Copy environment file
cp .env.example .env.local

# Edit .env.local with your API key
nano .env.local

# Run dev server
bun dev

# Submit a test assessment at http://localhost:3000
```

Check your inbox at work@warebee.com

### Check Deployment Logs

**Vercel:**
```bash
vercel logs
```

Or visit: Vercel Dashboard → Your Project → Deployments → View Function Logs

**Cloudflare:**
Visit: Cloudflare Pages → Your Project → Functions → Logs

## Custom Domain Setup

### Vercel

1. Go to Project Settings → Domains
2. Add your domain: `assessment.warebee.com`
3. Follow DNS configuration instructions
4. Wait for DNS propagation (up to 48 hours)

### Cloudflare Pages

1. Go to Custom Domains → Set up a custom domain
2. Enter: `assessment.warebee.com`
3. Cloudflare will automatically configure DNS

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild locally
rm -rf .next node_modules bun.lockb
bun install
bun run build
```

### Emails Not Sending

1. **Check environment variables** are set in your deployment platform
2. **Verify API key** is correct and has not expired
3. **Check function logs** for error messages
4. **Test locally** first to isolate deployment issues

For Resend, verify your domain:
- Resend Dashboard → Domains → Add Domain
- Follow DNS verification steps

### TypeScript Errors

```bash
# Run type check
bunx tsc --noEmit
```

### Styling Not Applied

Make sure tailwind.config.js includes your app paths:
```js
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
],
```

## Production Checklist

- [ ] Resend account created and domain verified
- [ ] Environment variables set in deployment platform (`RESEND_API_KEY`, `ASSESSMENT_EMAIL_TO`, `ASSESSMENT_EMAIL_FROM`)
- [ ] Custom domain configured (optional)
- [ ] Test all three assessment routes:
  - [ ] `/assessment/junior`
  - [ ] `/assessment/mid`
  - [ ] `/assessment/senior`
- [ ] Verify email arrives at `ASSESSMENT_EMAIL_TO` address
- [ ] Check email formatting (HTML view and JSON attachment)
- [ ] Test auto-save functionality
- [ ] Check responsive design on mobile
- [ ] Test form validation (required fields, minLength, maxLength)
- [ ] Verify SQL syntax highlighting works
- [ ] Review question content for accuracy in all three forms
- [ ] Test candidate can submit without errors

## Monitoring

### Vercel Analytics

Enable in: Project Settings → Analytics → Enable

### Email Delivery Monitoring

**Resend:**
- Dashboard shows all sent emails
- Click any email to see delivery status

**SendGrid:**
- Activity → Email Activity

## Updating Questions

Questions are now defined in Markform `.form.md` files:

1. Edit the appropriate form file:
   - `forms/junior-implementation.form.md` - Junior level
   - `forms/mid-implementation.form.md` - Mid level
   - `forms/senior-implementation.form.md` - Senior level

2. Commit and push changes:
   ```bash
   git add forms/
   git commit -m "Update assessment questions"
   git push
   ```

3. Vercel will auto-deploy the changes

### Markform Syntax Reference

```markdown
<!-- field kind="string" id="q1_1_answer" label="Your question here" role="agent" required=true minLength=50 maxLength=1000 -->
<!-- /field -->
```

Field types:
- `string` - Text input (short or long)
- `single_select` - Radio buttons
- `checkboxes` - Multiple choice
- `number` - Numeric input

See `forms/README.md` for detailed syntax documentation.

## Cost Estimation

**Free Tier (Perfect for recruiting):**
- Vercel: Unlimited preview deployments, 100GB bandwidth/month
- Cloudflare Pages: Unlimited requests, 500 builds/month
- Resend: 100 emails/day
- **Total: $0/month** for typical recruiting usage

**If you exceed free tier:**
- Vercel Pro: $20/month (unlimited bandwidth)
- Resend Pro: $20/month (50,000 emails/month)

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Cloudflare: [community.cloudflare.com](https://community.cloudflare.com)
- Resend: [resend.com/support](https://resend.com/support)

## File Structure

```
technical-assesment-app/
├── app/
│   ├── page.tsx                      # Landing page (role selection)
│   ├── assessment/
│   │   ├── [role]/
│   │   │   └── page.tsx              # Dynamic assessment pages
│   │   └── components/
│   │       ├── AssessmentForm.tsx    # Main form component
│   │       ├── FormField.tsx         # Field renderer
│   │       ├── SQLCodeInput.tsx      # SQL editor with syntax highlighting
│   │       └── FormSubmit.tsx        # Submit button
│   └── api/
│       └── assessment/
│           └── submit/
│               └── route.ts          # API endpoint for submissions
├── forms/
│   ├── junior-implementation.form.md # Junior (60-75 points)
│   ├── mid-implementation.form.md    # Mid (76-90 points)
│   ├── senior-implementation.form.md # Senior (91+ points)
│   └── README.md                     # Forms documentation
├── emails/
│   └── assessment-submission.tsx     # Email template
└── lib/
    └── markform-parser.ts            # Parser for .form.md files
```

## Grading Submissions

Submissions should be manually graded using:

1. **ANSWER_KEY_SAMPLE.md** - Sample answers and grading criteria
2. **IMPLEMENTATION_ROLE_QUESTIONS.md** - Full question bank with scoring rubric
3. **ASSESSMENT_ADMINISTRATION_GUIDE.md** - Interview and evaluation guide

The email includes:
- **HTML view**: Formatted questions and answers for easy reading
- **JSON attachment**: Structured data for programmatic analysis or ATS import

## Next Steps

After deployment:
1. Share assessment URLs with candidates:
   - Junior: `https://yourdomain.com/assessment/junior`
   - Mid-Level: `https://yourdomain.com/assessment/mid`
   - Senior: `https://yourdomain.com/assessment/senior`
2. Monitor submissions in your inbox (`ASSESSMENT_EMAIL_TO`)
3. Download JSON attachments for structured data
4. Grade using answer key and rubric
5. Provide feedback to candidates within 3-5 business days
6. Update questions based on candidate feedback and hiring needs
