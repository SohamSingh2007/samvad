import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function sendVerificationEmail(email: string, url: string) {
  try {
    await resend.emails.send({
      from: 'Samvad <onboarding@resend.dev>', // Use a verified domain in production
      to: email,
      subject: 'Verify your Samvad account',
      html: `
        <div>
          <h1>Welcome to Samvad!</h1>
          <p>Please click the link below to verify your email address and activate your account.</p>
          <a href="${url}" style="display:inline-block;padding:10px 20px;background-color:#0070f3;color:white;text-decoration:none;border-radius:5px;">Verify Email</a>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}

export async function sendResetPasswordEmail(email: string, url: string) {
  try {
    await resend.emails.send({
      from: 'Samvad <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your Samvad password',
      html: `
        <div>
          <h1>Password Reset Request</h1>
          <p>We received a request to reset your password. Click the link below to set a new password.</p>
          <a href="${url}" style="display:inline-block;padding:10px 20px;background-color:#0070f3;color:white;text-decoration:none;border-radius:5px;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send reset password email:', error);
  }
}
