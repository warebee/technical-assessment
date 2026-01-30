# SQL Technical Assessment App - Project Summary

## What Was Built

A complete, production-ready SQL technical assessment application for hiring data engineers.

### Core Features

✅ **3-Tab Interface**
- **Getting Started**: Candidate information collection with explainer
- **Test Datasets**: Downloadable SQL files with sample data
- **Questionnaire**: 13 questions across 5 sections (100 points)

✅ **State Persistence**
- Automatic save to localStorage on every change
- Survives page refreshes and accidental closes
- No data loss during assessment

✅ **Custom Theme**
- Dark theme with yellow brand color (#ffff33)
- Uses your exact color specifications:
  - Brand: `hsl(60, 100%, 60%)`
  - Background: `rgb(29,31,34)`
  - All menu, app, and sidebar colors applied

✅ **Optional Time Limit**
- Candidates choose: No limit, 60min, 90min, or 120min
- Timer displays in header (optional, not enforced)
- Tracks total time spent for analytics

✅ **Email Submission**
- Sends to: `work@warebee.com`
- Supports multiple services: Resend, SendGrid, Webhook
- Includes formatted email + JSON attachment
- Fallback to console logging for development

✅ **Question Management**
- Stored in `lib/questions.ts` (easy to edit)
- No hardcoded questions in components
- Sections: A, B, C, D, E with point values
- Supports SQL, text, and analysis question types

### Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (custom theme)
- **Icons**: Lucide React
- **Email**: Resend API (or SendGrid/Webhook)
- **Deployment**: Vercel (or Cloudflare Pages)

## File Structure

```
technical-assesment-app/
├── app/
│   ├── api/submit/route.ts      # Email submission handler
│   ├── globals.css              # Custom dark theme styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main assessment page (3 tabs)
├── lib/
│   ├── questions.ts             # All assessment questions
│   └── datasets.ts              # Test SQL datasets
├── .env.example                 # Environment template
├── package.json                 # Dependencies
├── tailwind.config.js           # Custom theme colors
├── README.md                    # Full documentation
├── DEPLOYMENT.md                # Deployment guide
└── PROJECT_SUMMARY.md           # This file
```

## Assessment Content

### Section A: Data Understanding (15 points)
- Timestamp analysis
- Scan code structure
- Process type mapping

### Section B: Basic SQL & Joins (25 points)
- Deduplication
- Item master joins
- Location assignment lookups
- Battery distribution analytics

### Section C: Window Functions & Job Logic (25 points)
- Location propagation with LAST_VALUE
- Job boundary detection with LAG
- Job aggregation statistics

### Section D: Full Transformation (20 points)
- Complete schema mapping to ActivityFeed
- Synthetic job start/end events

### Section E: Root Cause Analysis (15 points)
- Investigation query for picking accuracy
- Root cause analysis approach

## Data Schema

The assessment uses real WareBee IoT event data:

**Source Tables:**
- `events` - Raw IoT scan events
- `item_set` - Item master (EAN/SKU/UOM)
- `assignment` - Location-to-SKU mappings

**Target Schema:**
- `ActivityFeed` - Normalized warehouse activity

## How It Works

### 1. Candidate Flow

```
Landing Page
    ↓
Enter Name/Email/Position
    ↓
Choose Time Preference
    ↓
Start Assessment
    ↓
Review Test Datasets (downloadable)
    ↓
Answer 13 Questions across 5 sections
    ↓
Submit (sends to work@warebee.com)
    ↓
Confirmation Screen
```

### 2. State Persistence

```javascript
// Saves to localStorage on every change
useEffect(() => {
  localStorage.setItem('sql_assessment_state', JSON.stringify({
    candidateInfo,
    answers,
    startTime,
    currentSection
  }));
}, [candidateInfo, answers, startTime, currentSection]);

// Loads on mount
useEffect(() => {
  const savedState = localStorage.getItem('sql_assessment_state');
  if (savedState) {
    // Restore state
  }
}, []);
```

### 3. Email Submission

When submitted, the app:
1. Validates candidate info
2. Formats answers into readable email
3. Creates JSON attachment with structured data
4. Sends to `work@warebee.com` via configured service
5. Shows confirmation screen

## Deployment Options

### Option 1: Vercel (Recommended)

```bash
vercel
# Add RESEND_API_KEY environment variable
vercel --prod
```

**Live in 2 minutes!**

### Option 2: Cloudflare Pages

1. Push to GitHub
2. Connect Cloudflare Pages
3. Set build command: `bun run build`
4. Add environment variables
5. Deploy

## Email Services

The app supports 3 email services (choose one):

### Resend (Recommended)
- Free tier: 100 emails/day
- Easiest setup
- Perfect for Vercel

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=work@warebee.com
```

### SendGrid
- Free tier: 100 emails/day
- Good for production scale

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=assessment@yourdomain.com
```

### Webhook (Zapier/Make/n8n)
- Unlimited (depends on automation tool)
- Good for custom workflows

```env
WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxxxx
```

## Customization

### Change Questions

Edit `lib/questions.ts`:

```typescript
{
  id: 'A1',
  section: 'A',
  title: 'Your Question',
  points: 5,
  type: 'sql',
  prompt: 'Your question here...'
}
```

### Change Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  brand: 'hsl(60, 100%, 60%)',
  // ... your custom colors
}
```

### Change Recipient

Edit `app/api/submit/route.ts`:

```typescript
const RECIPIENT_EMAIL = 'your-email@company.com';
```

## Testing

### Local Development

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env.local

# Edit with your Resend API key
nano .env.local

# Run dev server
bun dev
```

Open http://localhost:3000 and submit a test assessment.

### Production Build

```bash
bun run build
bun start
```

## What You Can Do Next

### 1. Deploy to Production
Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

### 2. Customize Questions
Edit `lib/questions.ts` with your specific questions

### 3. Add More Sections
Extend the `sections` array in `lib/questions.ts`

### 4. Customize Branding
Update logo, colors, and text in `app/page.tsx`

### 5. Add Analytics
Enable Vercel Analytics or add Google Analytics

### 6. Create Evaluation Rubric
Use the provided evaluation guide in `sql_assessment_evaluation_guide.form.md`

## Key Advantages

✨ **No Vendor Lock-in**: Pure Next.js, deploy anywhere
✨ **Zero Database**: All state in localStorage, submissions via email
✨ **Free Hosting**: Vercel/Cloudflare free tiers are generous
✨ **Easy Updates**: Edit questions in code, git push to deploy
✨ **Responsive**: Works on desktop, tablet, mobile
✨ **Professional**: Clean UI with your custom branding

## Support & Maintenance

### Updating Questions
1. Edit `lib/questions.ts`
2. `git commit -am "Update questions"`
3. `git push`
4. Auto-deploys on Vercel/Cloudflare

### Monitoring Submissions
- Check `work@warebee.com` inbox
- Each submission includes JSON attachment for automated processing
- Email body is human-readable for quick review

### Troubleshooting
See [DEPLOYMENT.md](./DEPLOYMENT.md) for common issues and solutions

## Cost Breakdown

**Free Tier (100% free for typical usage):**
- Vercel: 100GB bandwidth/month
- Cloudflare Pages: Unlimited requests
- Resend: 100 emails/day
- **Total: $0/month**

Perfect for recruiting 1-10 candidates/day.

## Questions Included

The app includes these real-world SQL challenges:

1. Timestamp semantics and data pipeline understanding
2. String transformations (location code formatting)
3. Data type mappings and enum handling
4. Window functions (LAST_VALUE, LAG)
5. Job boundary detection (sessionization)
6. Multi-table joins with latest data selection
7. Aggregation and analytics
8. Full ETL pipeline design
9. Root cause analysis
10. Production debugging scenarios

All questions use your actual WareBee event data schema!

## Ready to Deploy?

```bash
vercel
```

That's it! Your assessment is live. 🚀
