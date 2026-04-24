import { SendMailClient } from "zeptomail";

const getClient = () => {
  const url = process.env.ZEPTO_API_URL!;
  const token = process.env.ZEPTO_API_TOKEN!;
  return new SendMailClient({ url, token });
};

interface SendEmailOptions {
  to: string;
  toName: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, toName, subject, html }: SendEmailOptions) => {
  const client = getClient();

  await client.sendMail({
    from: {
      address: process.env.ZEPTO_FROM_EMAIL!,
      name: process.env.ZEPTO_FROM_NAME || "Shop",
    },
    to: [
      {
        email_address: {
          address: to,
          name: toName,
        },
      },
    ],
    subject,
    htmlbody: html,
  });
};
