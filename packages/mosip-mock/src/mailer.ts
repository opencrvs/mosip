import * as nodemailer from "nodemailer";
import { env } from "./constants";

export const sendEmail = async (subject: string, text: string) => {
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
