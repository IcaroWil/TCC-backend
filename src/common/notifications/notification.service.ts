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
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: { user, pass },
      });
      this.fromAddress = `${fromName} <${user}>`;
    }
  }

  async sendEmail(to: string, subject: string, html: string, attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>) {
    try {
      if (!this.transporter || !to) return;
      await this.transporter.sendMail({ 
        from: this.fromAddress || process.env.EMAIL_USER, 
        to, 
        subject, 
        html,
        text: html.replace(/<[^>]*>/g, ''),
        attachments
      });
    } catch (err) {
      console.error('Email notification failed:', (err as Error).message);
    }
  }

  async sendWhatsApp(to: string, message: string) {
    // WhatsApp desabilitado: manter apenas e-mail por enquanto.
    return;
  }
}