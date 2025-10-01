import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter | null;
  private fromAddress: string | null = null;
  private resend: Resend | null = null;
  // private n8nWebhookUrl: string | null = null; // opcional

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const fromName = process.env.EMAIL_FROM_NAME;

    // Inicializa Resend se a API key estiver presente
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      this.resend = new Resend(resendKey);
    }

    if (!host || !user || !pass) {
      this.transporter = null;
    } else {
      // Simple, standard SMTP configuration using provided env vars
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // only use SSL if port 465
        auth: { user, pass }
      });
      this.fromAddress = `${fromName} <${user}>`;
    }
  }

  async sendEmail(to: string, subject: string, html: string, attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>) {
    try {
      console.log('📧 Attempting to send email...');
      console.log('📧 To:', to);
      console.log('📧 Subject:', subject);
      const usingResend = !!this.resend;
      console.log('📧 Using Resend:', usingResend);
      
      if (usingResend) {
        // Remetente para Resend deve ser de domínio próprio (não Gmail)
        const fromEmail = process.env.EMAIL_RESEND || process.env.EMAIL_FROM || process.env.EMAIL_FROM_USER || '';
        const fromName = process.env.EMAIL_FROM_NAME || 'App';
        if (!fromEmail) {
          console.log('❌ EMAIL_RESEND/EMAIL_FROM/EMAIL_FROM_USER ausente. Não foi possível enviar com Resend.');
          return;
        }
        const result = await this.resend!.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to,
          subject,
          html,
          attachments: attachments?.map((a) => ({
            filename: a.filename,
            content: a.content as any,
            contentType: a.contentType
          }))
        });
        console.log('✅ Email sent via Resend:', (result as any)?.id || 'ok');
        return;
      }

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

      console.log('✅ Email sent successfully (SMTP):', result.messageId);
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