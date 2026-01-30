import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import AssessmentSubmissionEmail from '@/emails/assessment-submission';
import { render } from '@react-email/render';
import { buildEmailData } from '@/lib/form-loader';
import { VERSION, logVersion } from '@/lib/version';

logVersion('assessment/submit');

// Only initialize Resend if API key is configured
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SubmissionData {
  roles: string[];
  role?: 'junior' | 'mid' | 'senior'; // Legacy support
  candidate: {
    name: string;
    email: string;
  };
  answers: Record<string, string | string[]>;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  console.log(`[assessment/submit] POST received - Version ${VERSION}`);
  console.log(`[assessment/submit] RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`);
  console.log(`[assessment/submit] RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || 'NOT SET'}`);
  console.log(`[assessment/submit] RESEND_TO_EMAIL: ${process.env.RESEND_TO_EMAIL || 'NOT SET'}`);

  try {
    // Parse request body
    const data: SubmissionData = await request.json();
    console.log(`[assessment/submit] Candidate: ${data.candidate?.name} <${data.candidate?.email}>`);
    console.log(`[assessment/submit] Roles: ${data.roles?.join(', ') || data.role}`);

    // Support both new roles array and legacy role field
    const roles = data.roles || (data.role ? [data.role] : []);

    // Validate required fields
    if (!data.candidate?.name || !data.candidate?.email || roles.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.candidate.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Generate role names for email
    const roleNamesStr = roles.map(r => getRoleName(r)).join(' + ');
    const rolesSlug = roles.join('-');

    // Build email data with question context (needed for both email and console)
    const emailDataForLog = buildEmailData(roles, data.answers);

    // Check if email service is configured
    if (!resend) {
      // Fallback: Log submission to console when email is not configured
      console.log('\n========================================');
      console.log('ASSESSMENT SUBMISSION (Email not configured)');
      console.log('========================================');
      console.log(`Candidate: ${data.candidate.name} (${data.candidate.email})`);
      console.log(`Roles: ${roleNamesStr}`);
      console.log(`Form Version: ${emailDataForLog?.version || 'unknown'}`);
      console.log(`Timestamp: ${data.timestamp}`);
      console.log('Answers:', JSON.stringify(data.answers, null, 2));
      console.log('========================================\n');

      return NextResponse.json({
        success: true,
        message: 'Assessment submitted successfully (logged to console - email not configured)',
        mode: 'console',
        formVersion: emailDataForLog?.version,
        apiVersion: VERSION,
      });
    }

    // Log email configuration for debugging
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'assessments@yourdomain.com';
    const toEmail = process.env.RESEND_TO_EMAIL || 'hiring@yourdomain.com';

    // Build recipient list: team email + candidate email
    const recipients = [toEmail, data.candidate.email];
    // Remove duplicates (in case candidate email is same as team email)
    const uniqueRecipients = [...new Set(recipients)];

    console.log('\n=== EMAIL DEBUG START ===');
    console.log(`API Key exists: ${!!process.env.RESEND_API_KEY}`);
    console.log(`API Key prefix: ${process.env.RESEND_API_KEY?.substring(0, 15)}...`);
    console.log(`From: "${fromEmail}"`);
    console.log(`To: ${JSON.stringify(uniqueRecipients)}`);
    console.log(`Candidate: ${data.candidate.name} <${data.candidate.email}>`);

    // Reuse the email data we built earlier
    const emailData = emailDataForLog;
    console.log('Email data built:', emailData ? `${emailData.sections.length} sections, version ${emailData.version}` : 'fallback mode');

    // Generate email content
    console.log('Generating email HTML...');
    const emailHtml = await render(
      AssessmentSubmissionEmail({
        candidateName: data.candidate.name,
        candidateEmail: data.candidate.email,
        role: roles[0] as 'junior' | 'mid' | 'senior', // Primary role for template
        roles: roles,
        answers: data.answers,
        timestamp: data.timestamp,
        formVersion: emailData?.version,
        sections: emailData?.sections,
      })
    );

    // Send email using Resend - to both team and candidate
    console.log('Sending email via Resend...');
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: uniqueRecipients,
      subject: `Assessment Submission - ${roleNamesStr} - ${data.candidate.name}`,
      html: emailHtml,
      attachments: [
        {
          filename: `assessment-${rolesSlug}-${data.candidate.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`,
          content: Buffer.from(JSON.stringify({
            formVersion: emailData?.version || 'unknown',
            ...data,
            roles,
          }, null, 2)),
        },
      ],
    });

    console.log('Resend response:', JSON.stringify(emailResponse, null, 2));

    if (emailResponse.error) {
      console.error('Resend error details:', JSON.stringify(emailResponse.error, null, 2));
      const errorMsg = emailResponse.error.message || JSON.stringify(emailResponse.error);
      throw new Error(`Failed to send email: ${errorMsg}`);
    }

    console.log('Email sent successfully! ID:', emailResponse.data?.id);
    console.log('=== EMAIL DEBUG END ===\n');

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Assessment submitted successfully',
      emailId: emailResponse.data?.id,
      apiVersion: VERSION,
    });
  } catch (error) {
    console.error('Submission error:', error);

    return NextResponse.json(
      {
        error: 'Failed to submit assessment',
        message: error instanceof Error ? error.message : 'Unknown error',
        apiVersion: VERSION,
      },
      { status: 500 }
    );
  }
}

// Helper function to get role display name
function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    junior: 'Junior Implementation',
    mid: 'Mid-Level Implementation',
    senior: 'Senior Implementation',
  };

  return roleNames[role] || role;
}
