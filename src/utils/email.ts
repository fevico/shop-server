import { Resend } from "resend";

const getClient = () => {
  const apiKey = process.env.RESEND_API_KEY!;
  return new Resend(apiKey);
};

interface SendEmailOptions {
  to: string;
  toName: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  const resend = getClient();

  await resend.emails.send({
    from: `${process.env.RESEND_FROM_NAME || "Shop"} <${process.env.RESEND_FROM_EMAIL!}>`,
    to,
    subject,
    html,
  });
};
