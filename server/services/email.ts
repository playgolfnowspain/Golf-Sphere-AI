import { Resend } from "resend";

const ADMIN_EMAIL = "playgolfnowspain@gmail.com";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || "GolfSphere <onboarding@resend.dev>";
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn("[email] Resend not configured. Skipping email send.");
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: getFromEmail(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error("[email] Failed to send email:", error);
      return false;
    }

    console.log(`[email] Email sent to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
    return true;
  } catch (error) {
    console.error("[email] Error sending email:", error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #166534; margin: 0;">GolfSphere</h1>
    <p style="color: #666; margin: 5px 0 0 0;">Your Spanish Golf Adventure Awaits</p>
  </div>

  <h2 style="color: #166534;">Welcome to the GolfSphere Newsletter!</h2>

  <p>Thank you for subscribing to our newsletter. You're now part of a community of golf enthusiasts who love Spanish courses.</p>

  <p>Every week, you'll receive:</p>
  <ul style="padding-left: 20px;">
    <li>The latest golf news from around the world</li>
    <li>Tips for playing Spanish courses</li>
    <li>Exclusive insights on Costa del Sol, Barcelona, Mallorca, and more</li>
    <li>Course recommendations and travel guides</li>
  </ul>

  <p>In the meantime, explore our latest articles and start planning your next golf trip to Spain!</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://golfsphere.com/articles" style="background-color: #166534; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Explore Articles</a>
  </div>

  <p style="color: #666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
    Happy golfing!<br>
    The GolfSphere Team
  </p>
</body>
</html>
`;

  const text = `
Welcome to the GolfSphere Newsletter!

Thank you for subscribing to our newsletter. You're now part of a community of golf enthusiasts who love Spanish courses.

Every week, you'll receive:
- The latest golf news from around the world
- Tips for playing Spanish courses
- Exclusive insights on Costa del Sol, Barcelona, Mallorca, and more
- Course recommendations and travel guides

Happy golfing!
The GolfSphere Team
`;

  return sendEmail({
    to: email,
    subject: "Welcome to GolfSphere - Your Spanish Golf Adventure Awaits!",
    html,
    text,
  });
}

export async function sendSubscriptionNotification(subscriberEmail: string): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
  <h2 style="color: #166534;">New Newsletter Subscriber</h2>

  <p>A new user has subscribed to the GolfSphere newsletter:</p>

  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <strong>Email:</strong> ${subscriberEmail}<br>
    <strong>Date:</strong> ${new Date().toLocaleString("en-GB", { timeZone: "Europe/Madrid" })}
  </div>

  <p style="color: #666; font-size: 14px;">This is an automated notification from GolfSphere.</p>
</body>
</html>
`;

  const text = `
New Newsletter Subscriber

A new user has subscribed to the GolfSphere newsletter:

Email: ${subscriberEmail}
Date: ${new Date().toLocaleString("en-GB", { timeZone: "Europe/Madrid" })}
`;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New GolfSphere Subscriber: ${subscriberEmail}`,
    html,
    text,
  });
}

export interface NewsletterContent {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export async function sendNewsletter(
  emails: string[],
  content: NewsletterContent
): Promise<{ sent: number; failed: number }> {
  const client = getResendClient();
  if (!client) {
    console.warn("[email] Resend not configured. Skipping newsletter send.");
    return { sent: 0, failed: emails.length };
  }

  let sent = 0;
  let failed = 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #166534;">
    <h1 style="color: #166534; margin: 0;">GolfSphere Weekly</h1>
    <p style="color: #666; margin: 5px 0 0 0;">Your Weekly Golf News Digest</p>
  </div>

  ${content.htmlContent}

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
    <p style="color: #666; font-size: 14px;">
      You're receiving this because you subscribed to the GolfSphere newsletter.
    </p>
    <p style="color: #999; font-size: 12px;">
      GolfSphere - Your Spanish Golf Adventure Awaits
    </p>
  </div>
</body>
</html>
`;

  for (const email of emails) {
    const success = await sendEmail({
      to: email,
      subject: content.subject,
      html,
      text: content.textContent,
    });

    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Small delay between emails to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Also send a copy to admin
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[ADMIN COPY] ${content.subject}`,
    html,
    text: content.textContent,
  });

  console.log(`[email] Newsletter sent: ${sent} succeeded, ${failed} failed`);
  return { sent, failed };
}
