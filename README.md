# SQL Technical Assessment App

A web application for conducting SQL technical assessments, built with Next.js and deployable to Vercel or Cloudflare for free.

## Features

- 📝 **3-Tab Interface**: Getting Started → Test Datasets → Questionnaire
- ⏱️ **Optional Timer**: Candidates choose their time preference
- 📊 **Progress Tracking**: Real-time completion percentage
- 📧 **Email Submissions**: Sends results to work@warebee.com
- 📥 **Downloadable Datasets**: SQL files for testing queries
- 📱 **Responsive Design**: Works on desktop and mobile

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/sql-assessment-app)

### Step 1: Deploy

1. Click the "Deploy with Vercel" button above, or:
   ```bash
   bunx vercel
   ```

2. Follow the prompts to link to your Vercel account

### Step 2: Configure Email Service

Go to your Vercel project → Settings → Environment Variables and add:

**For Resend (Recommended - easiest setup):**
```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Sign up at [resend.com](https://resend.com) (free: 100 emails/day)

**For SendGrid:**
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=assessment@yourdomain.com
```

**For Webhook (Zapier/Make/n8n):**
```
WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx
```

### Step 3: Redeploy

After adding environment variables, redeploy:
```bash
bunx vercel --prod
```

## Local Development

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your email service credentials

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Cloudflare Pages

1. Push code to GitHub

2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)

3. Create new project → Connect to Git

4. Configure build:
   - Build command: `bun run build`
   - Build output directory: `.next`

5. Add environment variables in Settings

6. Deploy!

Note: For Cloudflare, you may need to use the Edge runtime. The app should work, but email sending might require a Cloudflare Worker.

## Project Structure

```
sql-assessment-app/
├── app/
│   ├── api/
│   │   └── submit/
│   │       └── route.ts      # Email submission handler
│   ├── globals.css           # Tailwind styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main assessment page
├── lib/
│   ├── questions.ts          # Assessment questions
│   └── datasets.ts           # Test SQL datasets
├── public/
├── .env.example              # Environment template
├── package.json
├── tailwind.config.js
└── README.md
```

## Email Services Comparison

| Service | Free Tier | Setup Difficulty | Best For |
|---------|-----------|------------------|----------|
| **Resend** | 100/day | Easy | Vercel |
| **SendGrid** | 100/day | Medium | Production |
| **Webhook** | Unlimited* | Medium | Custom workflows |

*Webhook depends on your automation tool's limits

## Customization

### Changing Questions

Edit `lib/questions.ts`:

```typescript
export const questions: Question[] = [
  {
    id: 'A1',
    section: 'A',
    title: 'Your Question Title',
    points: 5,
    type: 'sql', // or 'text' or 'sql_analysis'
    prompt: 'Your question prompt...'
  },
  // ...
];
```

### Changing Recipient Email

Edit `app/api/submit/route.ts`:

```typescript
const RECIPIENT_EMAIL = 'your-email@company.com';
```

### Changing Branding

- Colors: Edit `tailwind.config.js` → `theme.extend.colors.warebee`
- Logo: Replace the "W" div in `app/page.tsx` header

### Adding Sections

Edit `lib/questions.ts`:

```typescript
export const sections: Section[] = [
  { id: 'A', title: 'Data Understanding', points: 15 },
  { id: 'B', title: 'Basic SQL', points: 25 },
  // Add your new section
  { id: 'F', title: 'New Section', points: 10 },
];
```

## Assessment Flow

```
┌─────────────────┐
│ Getting Started │ ← Candidate info, instructions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Test Datasets  │ ← Download SQL, review schemas
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Questionnaire  │ ← 13 questions, 5 sections
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Submit      │ ← Email to work@warebee.com
└─────────────────┘
```

## Email Format

Submissions are sent as:
- **Subject**: `SQL Assessment Submission - {Candidate Name}`
- **Body**: Formatted text with all answers
- **Attachment**: JSON file with structured data

Example email body:
```
SQL TECHNICAL ASSESSMENT SUBMISSION
====================================

CANDIDATE INFORMATION
---------------------
Name: Jane Doe
Email: jane@example.com
Time Taken: 1h 23m 45s
Progress: 100%

ANSWERS
-------

=== SECTION A ===

[A1]
time_received occurs first because...

[A2]
The scan code structure is...
```

## Troubleshooting

### Emails not sending

1. Check environment variables are set correctly
2. Verify your email service API key
3. Check Vercel function logs: `bunx vercel logs`

### Build errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
bun install
bun run build
```

### Styling issues

Make sure Tailwind is processing your files:
```bash
bunx tailwindcss -i ./app/globals.css -o ./output.css --watch
```

## License

MIT - Feel free to customize for your hiring needs!
