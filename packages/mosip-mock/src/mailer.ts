import * as nodemailer from "nodemailer";
import { EMAIL_ENABLED, env } from "./constants";

export const sendEmail = async (subject: string, text: string) => {
  if (!EMAIL_ENABLED) {
    console.log(`Interrupted email sending`, { subject, text });
    return;
  }

  const emailTransport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD,
    },
  });

  return emailTransport.sendMail({
    from: env.SENDER_EMAIL_ADDRESS,
    to: env.ALERT_EMAIL,
    subject,
    text,
  });
};
