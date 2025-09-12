import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter | null;
  private twilioConfig: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  } | null;

  constructor() {
    // Email configuration
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: { user, pass },
      });
    }

    // Twilio configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      this.twilioConfig = null;
    } else {
      this.twilioConfig = { accountSid, authToken, phoneNumber };
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      if (!this.transporter || !to) return;
      await this.transporter.sendMail({ 
        from: process.env.EMAIL_USER, 
        to, 
        subject, 
        html,
        text: html.replace(/<[^>]*>/g, '') // Fallback para clientes que não suportam HTML
      });
    } catch (err) {
      // Avoid failing business flow on notification errors
      // eslint-disable-next-line no-console
      console.error('Email notification failed:', (err as Error).message);
    }
  }

  async sendWhatsApp(to: string, message: string) {
    try {
      if (!this.twilioConfig || !to) return;

      // Format phone number (remove + if present, add +1 for Brazil)
      const formattedTo = to.startsWith('+') ? to : `+55${to.replace(/\D/g, '')}`;
      
      // Twilio WhatsApp API
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioConfig.accountSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append('From', `whatsapp:${this.twilioConfig.phoneNumber}`);
      formData.append('To', `whatsapp:${formattedTo}`);
      formData.append('Body', message);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.twilioConfig.accountSid}:${this.twilioConfig.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twilio API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('WhatsApp sent successfully:', result.sid);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('WhatsApp notification failed:', (err as Error).message);
    }
  }
}