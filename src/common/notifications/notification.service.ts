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
    const useSSL = process.env.SMTP_SSL === 'true';

    if (!host || !user || !pass) {
      this.transporter = null;
    } else {
      // Check if using SendGrid (common on Render)
      if (host.includes('sendgrid') || user.includes('sendgrid')) {
        this.transporter = nodemailer.createTransport({
          service: 'SendGrid',
          auth: { user, pass }
        });
      } else {
        // Check if it's Gmail and use service instead of SMTP
        if (host === 'smtp.gmail.com' || user.includes('@gmail.com')) {
          // Special configuration for Render
          const isRender = process.env.RENDER === 'true';
          
          if (isRender) {
            // Render-specific Gmail config - use SSL if specified
            this.transporter = nodemailer.createTransport({
              host: useSSL ? 'smtp.gmail.com' : undefined,
              port: useSSL ? 465 : undefined,
              secure: useSSL,
              service: useSSL ? undefined : 'gmail',
              auth: { user, pass },
              connectionTimeout: 30000,
              greetingTimeout: 15000,
              socketTimeout: 30000,
              pool: false,
              tls: {
                rejectUnauthorized: false
              }
            });
          } else {
            // Local development - use SSL if specified
            this.transporter = nodemailer.createTransport({
              host: useSSL ? 'smtp.gmail.com' : undefined,
              port: useSSL ? 465 : undefined,
              secure: useSSL,
              service: useSSL ? undefined : 'gmail',
              auth: { user, pass },
              connectionTimeout: 15000,
              greetingTimeout: 10000,
              socketTimeout: 15000,
              pool: false,
              ...(useSSL && {
                tls: {
                  rejectUnauthorized: false
                }
              })
            });
          }
        } else {
          // Other SMTP providers
          this.transporter = nodemailer.createTransport({
            host,
            port: 465, // Use SSL port
            secure: true, // Use SSL
            auth: { user, pass },
            connectionTimeout: 15000, // 15 seconds
            greetingTimeout: 10000,   // 10 seconds
            socketTimeout: 15000,     // 15 seconds
            pool: false,
            tls: {
              rejectUnauthorized: false,
              ciphers: 'TLSv1.2'
            },
            // Additional options for Render
            ignoreTLS: false,
            requireTLS: true,
            debug: false
          });
        }
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