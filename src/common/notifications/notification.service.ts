import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter | null;
  private fromAddress: string | null = null;
  // private n8nWebhookUrl: string | null = null; // opcional

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const fromName = process.env.EMAIL_FROM_NAME;

    if (!host || !user || !pass) {
      this.transporter = null;
    } else {
      // Check if using SendGrid (common on Render)
      if (host.includes('sendgrid') || user.includes('sendgrid')) {
        this.transporter = nodemailer.createTransporter({
          service: 'SendGrid',
          auth: { user, pass }
        });
      } else {
        // Gmail or other SMTP
        this.transporter = nodemailer.createTransporter({
          host,
          port,
          secure: false, // true for 465, false for other ports
          auth: { user, pass },
          connectionTimeout: 60000, // 60 seconds
          greetingTimeout: 30000,   // 30 seconds
          socketTimeout: 60000,     // 60 seconds
          pool: true, // use pooled connections
          maxConnections: 1, // limit to 1 connection
          maxMessages: 3, // limit to 3 messages per connection
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          }
        });
      }
      this.fromAddress = `${fromName} <${user}>`;
    }
  }

  async sendEmail(to: string, subject: string, html: string, attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>) {
    try {
      console.log('📧 Attempting to send email...');
      console.log('📧 To:', to);
      console.log('📧 Subject:', subject);
      console.log('📧 Transporter available:', !!this.transporter);
      console.log('📧 SMTP Host:', process.env.SMTP_HOST);
      console.log('📧 SMTP Port:', process.env.SMTP_PORT);
      
      if (!this.transporter || !to) {
        console.log('❌ Email not sent - transporter or recipient missing');
        return;
      }
      
      const result = await this.transporter.sendMail({ 
        from: this.fromAddress || process.env.EMAIL_USER, 
        to, 
        subject, 
        html,
        text: html.replace(/<[^>]*>/g, ''),
        attachments
      });
      
      console.log('✅ Email sent successfully:', result.messageId);
    } catch (err) {
      console.error('❌ Email notification failed:', (err as Error).message);
      console.error('❌ Full error:', err);
    }
  }

  async sendWhatsApp(to: string, message: string) {
    // WhatsApp desabilitado: manter apenas e-mail por enquanto.
    return;
  }
}