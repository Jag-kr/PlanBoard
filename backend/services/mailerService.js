const transporter = require("../config/mailer");
require("dotenv").config();

/**
 * Sends a workspace invitation email.
 *
 * @param {string} to           - Recipient email address
 * @param {string} token        - Unique invitation token
 * @param {string} workspaceName - Name of the workspace being joined
 * @param {string} inviterName  - Name of the person sending the invite
 */
const sendInvitationEmail = async (to, token, workspaceName, inviterName) => {
  if (
    !process.env.GMAIL_USER ||
    process.env.GMAIL_USER === "your_gmail@gmail.com"
  ) {
    console.warn(
      `[MailerService] GMAIL_USER not configured — skipping invitation email to ${to}.`,
    );
    return;
  }

  const inviteUrl = `${process.env.CLIENT_URL}/signup?invite=${token}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>You're invited to PlanBoard</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px; }
        .body { padding: 36px 32px; }
        .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
        .workspace-name { display: inline-block; background: #f3f4f6; color: #1f2937; font-weight: 600; padding: 4px 12px; border-radius: 6px; font-size: 15px; }
        .cta { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; }
        .footer { padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
        .url { word-break: break-all; color: #6366f1; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 PlanBoard</h1>
          <p>Your project management workspace</p>
        </div>
        <div class="body">
          <p>Hi there,</p>
          <p>
            <strong>${inviterName}</strong> has invited you to join the
            <span class="workspace-name">${workspaceName}</span> workspace on PlanBoard.
          </p>
          <p>Click the button below to accept your invitation and get started:</p>
          <div class="cta">
            <a href="${inviteUrl}" class="btn">Accept Invitation</a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p class="url">${inviteUrl}</p>
          <p style="color:#9ca3af;font-size:13px;">This invitation was sent to ${to}. If you did not expect this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PlanBoard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"PlanBoard" <${process.env.GMAIL_USER}>`,
      to,
      subject: `${inviterName} invited you to join "${workspaceName}" on PlanBoard`,
      html,
    });
    console.log(`[MailerService] Invitation email sent to ${to}`);
  } catch (err) {
    console.error(
      `[MailerService] Failed to send email to ${to}:`,
      err.message,
    );
    // Do not re-throw — email failure should not break the invitation flow
  }
};

module.exports = { sendInvitationEmail };
