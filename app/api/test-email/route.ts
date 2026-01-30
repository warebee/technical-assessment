import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { VERSION, logVersion } from '@/lib/version';

logVersion('test-email');

export async function GET() {
  console.log(`[test-email] GET request received - Version ${VERSION}`);

  const config = {
    version: VERSION,
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'NOT SET (using default)',
    toEmail: process.env.RESEND_TO_EMAIL || 'NOT SET (using default)',
    nodeEnv: process.env.NODE_ENV,
  };

  // If no API key, return config info only
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'RESEND_API_KEY not configured',
      config,
    });
  }

  // Try to send a test email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toEmail = process.env.RESEND_TO_EMAIL || 'delivered@resend.dev';

    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Assessment App - Test Email',
      html: `
        <h1>Test Email from Assessment App</h1>
        <p>If you received this, your email configuration is working!</p>
        <hr>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>From: ${fromEmail}</li>
          <li>To: ${toEmail}</li>
          <li>Time: ${new Date().toISOString()}</li>
        </ul>
      `,
    });

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error,
        config,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      emailId: result.data?.id,
      config,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config,
    });
  }
}
