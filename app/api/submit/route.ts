import { NextRequest, NextResponse } from 'next/server';

const RECIPIENT_EMAIL = 'work@warebee.com';

interface Submission {
  candidate: {
    name: string;
    email: string;
    position: string;
    timeLimit: string;
  };
  startTime: string;
  endTime: string;
  totalTimeSeconds: number;
  answers: Record<string, string>;
  progress: number;
}

function formatSubmissionEmail(data: Submission): string {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  let emailBody = `
SQL TECHNICAL ASSESSMENT SUBMISSION
====================================

CANDIDATE INFORMATION
---------------------
Name: ${data.candidate.name}
Email: ${data.candidate.email}
Position: ${data.candidate.position || 'Not specified'}
Time Preference: ${data.candidate.timeLimit === 'no_limit' ? 'Self-paced' : data.candidate.timeLimit + ' minutes'}

ASSESSMENT METRICS
------------------
Started: ${data.startTime}
Completed: ${data.endTime}
Time Taken: ${formatTime(data.totalTimeSeconds)}
Progress: ${data.progress}%

ANSWERS
-------
`;

  // Group answers by section
  const sections = ['A', 'B', 'C', 'D', 'E'];
  for (const section of sections) {
    emailBody += `\n=== SECTION ${section} ===\n`;
    for (const [key, value] of Object.entries(data.answers)) {
      if (key.startsWith(section)) {
        emailBody += `\n[${key}]\n${value || '(not answered)'}\n`;
      }
    }
  }

  return emailBody;
}

function formatSubmissionJSON(data: Submission): string {
  return JSON.stringify(data, null, 2);
}

export async function POST(request: NextRequest) {
  try {
    const data: Submission = await request.json();
    
    // Validate required fields
    if (!data.candidate?.name || !data.candidate?.email) {
      return NextResponse.json(
        { error: 'Missing required candidate information' },
        { status: 400 }
      );
    }

    const emailBody = formatSubmissionEmail(data);
    const jsonAttachment = formatSubmissionJSON(data);

    // Try different email services based on available env vars
    
    // Option 1: Resend (recommended for Vercel)
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'assessment@resend.dev',
          to: RECIPIENT_EMAIL,
          subject: `SQL Assessment Submission - ${data.candidate.name}`,
          text: emailBody,
          attachments: [
            {
              filename: `${data.candidate.name.replace(/\s+/g, '_')}_assessment.json`,
              content: Buffer.from(jsonAttachment).toString('base64'),
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resend error:', errorText);
        throw new Error('Email service error');
      }

      return NextResponse.json({ success: true, method: 'resend' });
    }

    // Option 2: SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: RECIPIENT_EMAIL }] }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@warebee.com' },
          subject: `SQL Assessment Submission - ${data.candidate.name}`,
          content: [{ type: 'text/plain', value: emailBody }],
          attachments: [
            {
              content: Buffer.from(jsonAttachment).toString('base64'),
              filename: `${data.candidate.name.replace(/\s+/g, '_')}_assessment.json`,
              type: 'application/json',
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error('SendGrid error');
      }

      return NextResponse.json({ success: true, method: 'sendgrid' });
    }

    // Option 3: Webhook (e.g., Zapier, Make, n8n)
    if (process.env.WEBHOOK_URL) {
      const response = await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: RECIPIENT_EMAIL,
          subject: `SQL Assessment Submission - ${data.candidate.name}`,
          body: emailBody,
          data: data,
        }),
      });

      if (!response.ok) {
        throw new Error('Webhook error');
      }

      return NextResponse.json({ success: true, method: 'webhook' });
    }

    // Option 4: Log to console (development fallback)
    console.log('========== ASSESSMENT SUBMISSION ==========');
    console.log(emailBody);
    console.log('========== JSON DATA ==========');
    console.log(jsonAttachment);
    console.log('===========================================');
    
    // In development, just log and return success
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        success: true, 
        method: 'console',
        message: 'Submission logged to console (no email service configured)'
      });
    }

    // In production without any service configured, return error
    return NextResponse.json(
      { 
        error: 'No email service configured',
        message: 'Please configure RESEND_API_KEY, SENDGRID_API_KEY, or WEBHOOK_URL'
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
