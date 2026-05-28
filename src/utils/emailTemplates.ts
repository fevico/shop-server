const brandColor = "#4F46E5";
const brandName = process.env.RESEND_FROM_NAME || "Shop";

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
    /* Order confirmation styles */
    .order-badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; border-radius: 999px; padding: 6px 18px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
    .order-info { background: #f8f8ff; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
    .order-info-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; border-bottom: 1px solid #ebebeb; }
    .order-info-row:last-child { border-bottom: none; }
    .order-info-row span:first-child { color: #888; }
    .order-info-row span:last-child { font-weight: 600; color: #1a1a2e; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background: ${brandColor}; color: #fff; font-size: 13px; font-weight: 600; padding: 10px 14px; text-align: left; }
    .items-table td { font-size: 14px; padding: 12px 14px; border-bottom: 1px solid #f0f0f0; color: #444; vertical-align: middle; }
    .items-table tr:last-child td { border-bottom: none; }
    .items-table .item-img { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; background: #f0f0f0; }
    .total-row { background: #f0f0ff; }
    .total-row td { font-weight: 700; font-size: 15px; color: #1a1a2e; }
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

export interface OrderConfirmationItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export const orderConfirmationEmailTemplate = (
  name: string,
  orderNumber: string,
  reference: string,
  items: OrderConfirmationItem[],
  totalAmount: number,
  shippingAddress?: {
    fullName: string;
    address: string;
    city: string;
  }
) => {
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td>
        ${
          item.image
            ? `<img src="${item.image}" alt="${item.name}" class="item-img" />`
            : `<div class="item-img" style="display:inline-block;"></div>`
        }
      </td>
      <td><strong>${item.name}</strong></td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">₦${(item.price * item.quantity).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
    </tr>`
    )
    .join("");

  const shippingBlock = shippingAddress
    ? `
    <hr class="divider" />
    <h2 style="font-size:17px; margin-bottom:12px;">Shipping To</h2>
    <div class="order-info">
      <div class="order-info-row"><span>Name</span><span>${shippingAddress.fullName}</span></div>
      <div class="order-info-row"><span>Address</span><span>${shippingAddress.address}</span></div>
      <div class="order-info-row"><span>City</span><span>${shippingAddress.city}</span></div>
    </div>`
    : "";

  return baseTemplate(`
    <div style="text-align:center;">
      <span class="order-badge">✅ Order Confirmed</span>
    </div>

    <h2>Thank you for your order, ${name || "there"}!</h2>
    <p>We've received your order and it's being processed. You'll receive another email when your items are on the way.</p>

    <div class="order-info">
      <div class="order-info-row"><span>Order Number</span><span>#${orderNumber}</span></div>
      <div class="order-info-row"><span>Payment Reference</span><span>${reference}</span></div>
      <div class="order-info-row"><span>Date</span><span>${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span></div>
      <div class="order-info-row"><span>Status</span><span style="color:#065f46;">Paid ✓</span></div>
    </div>

    <hr class="divider" />
    <h2 style="font-size:17px; margin-bottom:12px;">Order Summary</h2>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width:56px;"></th>
          <th>Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="total-row">
          <td colspan="3" style="text-align:right; padding-right:14px;">Total</td>
          <td style="text-align:right;">₦${totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    ${shippingBlock}

    <hr class="divider" />
    <p style="font-size:14px; color:#777;">Have a question about your order? Reply to this email or contact our support team.</p>
  `);
};
