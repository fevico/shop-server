const brandColor = "#4F46E5";
const brandName = process.env.ZEPTO_FROM_NAME || "Shop";

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${brandName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f4f4f8; font-family: 'Segoe UI', Arial, sans-serif; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: ${brandColor}; padding: 36px 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 1px; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 4px; }
    .body { padding: 40px; }
    .body h2 { font-size: 22px; color: #1a1a2e; margin-bottom: 12px; }
    .body p { font-size: 15px; color: #555; line-height: 1.7; margin-bottom: 16px; }
    .otp-box { background: #f0f0ff; border: 2px dashed ${brandColor}; border-radius: 10px; text-align: center; padding: 28px 20px; margin: 28px 0; }
    .otp-box .otp { font-size: 42px; font-weight: 800; letter-spacing: 10px; color: ${brandColor}; }
    .otp-box small { display: block; color: #888; font-size: 13px; margin-top: 8px; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: ${brandColor}; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.5px; }
    .divider { border: none; border-top: 1px solid #ebebeb; margin: 28px 0; }
    .note { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 14px 18px; font-size: 13px; color: #92400e; margin-bottom: 20px; }
    .footer { background: #f9f9fb; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #999; line-height: 1.6; }
    .footer a { color: ${brandColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${brandName}</h1>
      <p>Your trusted shopping destination</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>You received this email because an action was initiated on your ${brandName} account.<br/>
      If you did not perform this action, you can safely ignore this email.</p>
      <p style="margin-top:10px;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const otpEmailTemplate = (name: string, otp: string) =>
  baseTemplate(`
    <h2>Verify Your Email Address</h2>
    <p>Hi <strong>${name || "there"}</strong>,</p>
    <p>Welcome to <strong>${brandName}</strong>! We're excited to have you on board. To complete your registration, please verify your email address using the one-time code below.</p>

    <div class="otp-box">
      <div class="otp">${otp}</div>
      <small>This code expires in <strong>10 minutes</strong></small>
    </div>

    <div class="note">
      <strong>Security tip:</strong> Never share this code with anyone. ${brandName} will never ask for your OTP.
    </div>

    <p>If you did not create an account, please disregard this email — no action is needed.</p>
  `);

export const resendOtpEmailTemplate = (name: string, otp: string) =>
  baseTemplate(`
    <h2>Your New Verification Code</h2>
    <p>Hi <strong>${name || "there"}</strong>,</p>
    <p>You requested a new verification code. Use the code below to verify your email address.</p>

    <div class="otp-box">
      <div class="otp">${otp}</div>
      <small>This code expires in <strong>10 minutes</strong></small>
    </div>

    <div class="note">
      <strong>Security tip:</strong> Never share this code with anyone. ${brandName} will never ask for your OTP.
    </div>

    <p>If you did not request this, please secure your account immediately.</p>
  `);

export const passwordResetEmailTemplate = (name: string, resetLink: string) =>
  baseTemplate(`
    <h2>Reset Your Password</h2>
    <p>Hi <strong>${name || "there"}</strong>,</p>
    <p>We received a request to reset the password for your <strong>${brandName}</strong> account. Click the button below to set a new password.</p>

    <div class="btn-wrap">
      <a href="${resetLink}" class="btn">Reset My Password</a>
    </div>

    <hr class="divider" />

    <p style="font-size:13px; color:#777;">Or copy and paste this link into your browser:</p>
    <p style="font-size:13px; word-break:break-all; color:${brandColor};">${resetLink}</p>

    <div class="note" style="margin-top:24px;">
      <strong>This link expires in 1 hour.</strong> If you did not request a password reset, no changes have been made to your account.
    </div>
  `);

export const passwordChangedEmailTemplate = (name: string) =>
  baseTemplate(`
    <h2>Password Changed Successfully</h2>
    <p>Hi <strong>${name || "there"}</strong>,</p>
    <p>Your <strong>${brandName}</strong> account password was changed successfully.</p>
    <p>If you made this change, you can safely ignore this email.</p>

    <div class="note">
      <strong>Didn't change your password?</strong> Your account may be at risk. Please contact our support team immediately.
    </div>
  `);
