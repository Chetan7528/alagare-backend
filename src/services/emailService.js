const postmark = require('postmark');

const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || 'support@cleverclee.com.au';
const MESSAGE_STREAM = process.env.POSTMARK_MESSAGE_STREAM || 'outbound';

let postmarkClient = null;

const getPostmarkClient = () => {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    throw new Error('POSTMARK_API_TOKEN is not set in server .env file');
  }
  if (!postmarkClient) {
    postmarkClient = new postmark.ServerClient(token);
  }
  return postmarkClient;
};

const sendBookingConfirmation = async (booking) => {
  const customer = booking.customer || {};
  const customerName = customer.firstName
    ? `${customer.firstName} ${customer.lastName || ''}`.trim()
    : customer.fullname || 'Customer';
  const customerEmail = customer.email;

  if (!customerEmail) return;

  const bookingDate = booking.date
    ? new Date(booking.date).toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const bookingTime = booking.time || 'N/A';

  const staffName =
    booking.staff?.fullname || booking.staff?.name || 'Any Available Staff';

  const servicesList = (() => {
    if (booking.services && booking.services.length > 0) {
      return booking.services
        .map((s) => {
          if (typeof s === 'object') return s.name || 'Service';
          return s;
        })
        .filter(Boolean)
        .join(', ');
    }
    if (booking.service && booking.service.length > 0) {
      return booking.service
        .map((s) => {
          if (typeof s === 'object') return s.name || 'Service';
          return s;
        })
        .filter(Boolean)
        .join(', ');
    }
    return 'N/A';
  })();

  const totalAmount =
    booking.totalAmount != null ? `$${Number(booking.totalAmount).toFixed(2)}` : 'N/A';

  const depositAmount =
    booking.depositAmount && booking.depositAmount > 0
      ? `$${Number(booking.depositAmount).toFixed(2)}`
      : null;

  const status = booking.status || 'Pending';

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e0e0e0;">
        
        <div style="background-color: #0A4D91; padding: 30px 30px 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Booking Confirmation</h1>
          <p style="color: #c8d9f0; margin: 6px 0 0; font-size: 14px;">Thank you for booking with us!</p>
        </div>

        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${customerName}</strong>,</p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            Your appointment has been successfully booked. Here are your booking details:
          </p>

          <div style="background-color: #f0f5ff; border-left: 4px solid #0A4D91; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 40%; color: #0A4D91;">Status</td>
                <td style="padding: 8px 0;">${status}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #0A4D91;">Date</td>
                <td style="padding: 8px 0;">${bookingDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #0A4D91;">Time</td>
                <td style="padding: 8px 0;">${bookingTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #0A4D91;">Services</td>
                <td style="padding: 8px 0;">${servicesList}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #0A4D91;">Staff</td>
                <td style="padding: 8px 0;">${staffName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #0A4D91;">Total Amount</td>
                <td style="padding: 8px 0;">${totalAmount}</td>
              </tr>
              ${
                depositAmount
                  ? `<tr>
                <td style="padding: 8px 0; font-weight: bold; color: #0A4D91;">Deposit Paid</td>
                <td style="padding: 8px 0;">${depositAmount}</td>
              </tr>`
                  : ''
              }
              ${
                booking.comments
                  ? `<tr>
                <td style="padding: 8px 0; font-weight: bold; color: #0A4D91;">Notes</td>
                <td style="padding: 8px 0;">${booking.comments}</td>
              </tr>`
                  : ''
              }
            </table>
          </div>

          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            If you need to reschedule or cancel your appointment, please contact us as soon as possible.
          </p>

          <p style="font-size: 14px; color: #555; margin-top: 24px;">
            We look forward to seeing you!<br/>
            <strong style="color: #0A4D91;">The Clee Team</strong>
          </p>
        </div>

        <div style="background-color: #f4f6f9; padding: 16px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0;">This is an automated confirmation email. Please do not reply to this message.</p>
          <p style="margin: 6px 0 0;">&copy; ${new Date().getFullYear()} Clee. All rights reserved.</p>
        </div>

      </div>
    </div>
  `;

  await getPostmarkClient().sendEmail({
    From: FROM_EMAIL,
    To: customerEmail,
    Subject: 'Your Booking Confirmation – Clee',
    HtmlBody: html,
    MessageStream: MESSAGE_STREAM,
  });
};

const sendOtpEmail = async ({ email, name, otp }) => {
  if (!email || !otp) {
    throw new Error('Email and OTP are required to send verification mail');
  }

  const displayName = name || 'there';
  const fromEmail = FROM_EMAIL;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e0e0e0;">
        <div style="background-color: #0A4D91; padding: 28px 30px 22px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Password Reset Code</h1>
          <p style="color: #c8d9f0; margin: 8px 0 0; font-size: 14px;">Double Bay Cosmeceuticals</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin: 0 0 12px;">Hi <strong>${displayName}</strong>,</p>
          <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 20px;">
            Use the verification code below to reset your password. This code expires in <strong>5 minutes</strong>.
          </p>
          <div style="background-color: #f0f5ff; border: 1px solid #d6e4ff; border-radius: 8px; padding: 22px; text-align: center; margin: 0 0 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #0A4D91;">Your OTP</p>
            <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 0.35em; color: #001b36;">${otp}</p>
          </div>
          <p style="font-size: 13px; color: #777; line-height: 1.6; margin: 0;">
            If you did not request this code, you can safely ignore this email. Your account remains secure.
          </p>
          <p style="font-size: 14px; color: #555; margin: 24px 0 0;">
            Regards,<br/>
            <strong style="color: #0A4D91;">Double Bay Cosmeceuticals</strong>
          </p>
        </div>
        <div style="background-color: #f4f6f9; padding: 14px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </div>
  `;

  const textBody = `Hi ${displayName},\n\nYour Double Bay password reset code is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, ignore this email.\n\nDouble Bay Cosmeceuticals`;

  try {
    const result = await getPostmarkClient().sendEmail({
      From: fromEmail,
      To: email,
      Subject: 'Your Double Bay verification code',
      HtmlBody: html,
      TextBody: textBody,
      MessageStream: MESSAGE_STREAM,
    });
    console.log('[Postmark] OTP sent:', result.MessageID, '→', email);
    return result;
  } catch (err) {
    const detail = err?.message || String(err);
    console.error('[Postmark] OTP failed:', detail);
    if (err?.statusCode === 422 || /sender|signature|from/i.test(detail)) {
      throw new Error(
        `Postmark sender not verified. Set POSTMARK_FROM_EMAIL in .env to a verified sender in Postmark. (${detail})`,
      );
    }
    throw new Error(`Failed to send OTP email: ${detail}`);
  }
};

const sendNewsletterConfirmEmail = async ({ email, confirmUrl }) => {
  if (!email || !confirmUrl) {
    throw new Error('Email and confirmation URL are required');
  }

  const html =
    '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f9;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f6f9;padding:30px 12px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">' +
    '<tr><td style="background:#0b121e;padding:28px 30px;">' +
    '<h1 style="margin:0;font-family:Arial,sans-serif;font-size:22px;color:#ffffff;">Confirm your subscription</h1>' +
    '<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#c8d4e8;">Double Bay Cosmeceuticals</p>' +
    '</td></tr>' +
    '<tr><td style="padding:30px;font-family:Arial,sans-serif;">' +
    '<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555;">Thanks for signing up. Tap the link below to confirm your email.</p>' +
    '<p style="margin:0 0 24px;font-size:16px;line-height:1.5;">' +
    '<a href="' +
    confirmUrl +
    '" style="color:#0b121e;font-weight:700;text-decoration:underline;">Confirm my subscription</a>' +
    '</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">' +
    '<tr><td bgcolor="#0b121e" style="border-radius:8px;">' +
    '<a href="' +
    confirmUrl +
    '" style="display:inline-block;padding:14px 28px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Confirm subscription</a>' +
    '</td></tr></table>' +
    '<p style="margin:0;font-size:13px;line-height:1.6;color:#777;">Or open this link in your browser:</p>' +
    '<p style="margin:8px 0 0;font-size:13px;line-height:1.6;word-break:break-all;">' +
    '<a href="' +
    confirmUrl +
    '" style="color:#0b121e;text-decoration:underline;">' +
    confirmUrl +
    '</a></p>' +
  '</td></tr></table></td></tr></table></body></html>';

  const textBody =
    'Confirm your Double Bay newsletter subscription.\n\n' +
    confirmUrl +
    '\n\nOpen the link above in your browser to confirm.\n';

  await getPostmarkClient().sendEmail({
    From: FROM_EMAIL,
    To: email,
    Subject: 'Confirm your newsletter subscription – Double Bay',
    HtmlBody: html,
    TextBody: textBody,
    MessageStream: MESSAGE_STREAM,
    TrackLinks: 'None',
    TrackOpens: false,
  });
};

module.exports = { sendBookingConfirmation, sendOtpEmail, sendNewsletterConfirmEmail };
