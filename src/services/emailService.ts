import nodemailer from 'nodemailer';
import { EmailTemplate, NotificationData } from '@/types';
import { formatDateTime, formatDateToBR, formatTime } from '@/utils/date';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Enviar email genérico
   */
  async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Timelyfy',
          address: process.env.FROM_EMAIL || 'noreply@timelyfy.com',
        },
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email enviado para ${template.to}: ${template.subject}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  /**
   * Enviar confirmação de agendamento
   */
  async sendAppointmentConfirmation(data: NotificationData): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.clientEmail,
      subject: '✅ Agendamento Confirmado - Timelyfy',
      html: this.getConfirmationTemplate(data),
      text: this.getConfirmationText(data),
    };

    return this.sendEmail(template);
  }

  /**
   * Enviar lembrete de agendamento
   */
  async sendAppointmentReminder(data: NotificationData): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.clientEmail,
      subject: '⏰ Lembrete de Agendamento - Timelyfy',
      html: this.getReminderTemplate(data),
      text: this.getReminderText(data),
    };

    return this.sendEmail(template);
  }

  /**
   * Enviar notificação de cancelamento
   */
  async sendAppointmentCancellation(data: NotificationData): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.clientEmail,
      subject: '❌ Agendamento Cancelado - Timelyfy',
      html: this.getCancellationTemplate(data),
      text: this.getCancellationText(data),
    };

    return this.sendEmail(template);
  }

  /**
   * Enviar notificação de reagendamento
   */
  async sendAppointmentReschedule(data: NotificationData): Promise<boolean> {
    const template: EmailTemplate = {
      to: data.clientEmail,
      subject: '📅 Agendamento Reagendado - Timelyfy',
      html: this.getRescheduleTemplate(data),
      text: this.getRescheduleText(data),
    };

    return this.sendEmail(template);
  }

  /**
   * Template HTML para confirmação
   */
  private getConfirmationTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Agendamento Confirmado</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Agendamento Confirmado!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.clientName}</strong>,</p>
              <p>Seu agendamento foi confirmado com sucesso. Abaixo estão os detalhes:</p>
              
              <div class="appointment-details">
                <div class="detail-row">
                  <span class="detail-label">Serviço:</span>
                  <span class="detail-value">${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Data:</span>
                  <span class="detail-value">${formatDateToBR(data.appointmentDate)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Horário:</span>
                  <span class="detail-value">${data.appointmentTime}</span>
                </div>
              </div>
              
              <p>Por favor, chegue com 15 minutos de antecedência.</p>
              <p>Caso precise cancelar ou reagendar, entre em contato conosco o quanto antes.</p>
              
              <div class="footer">
                <p>Este é um email automático, não responda a esta mensagem.</p>
                <p><strong>Timelyfy</strong> - Sistema de Agendamentos</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template texto para confirmação
   */
  private getConfirmationText(data: NotificationData): string {
    return `
      AGENDAMENTO CONFIRMADO
      
      Olá ${data.clientName},
      
      Seu agendamento foi confirmado com sucesso:
      
      Serviço: ${data.serviceName}
      Data: ${formatDateToBR(data.appointmentDate)}
      Horário: ${data.appointmentTime}
      
      Por favor, chegue com 15 minutos de antecedência.
      
      Timelyfy - Sistema de Agendamentos
    `;
  }

  /**
   * Template HTML para lembrete
   */
  private getReminderTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete de Agendamento</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Lembrete de Agendamento</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.clientName}</strong>,</p>
              <p>Este é um lembrete do seu agendamento para amanhã:</p>
              
              <div class="appointment-details">
                <div class="detail-row">
                  <span class="detail-label">Serviço:</span>
                  <span class="detail-value">${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Data:</span>
                  <span class="detail-value">${formatDateToBR(data.appointmentDate)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Horário:</span>
                  <span class="detail-value">${data.appointmentTime}</span>
                </div>
              </div>
              
              <p>Lembre-se de chegar com 15 minutos de antecedência.</p>
              
              <div class="footer">
                <p>Este é um email automático, não responda a esta mensagem.</p>
                <p><strong>Timelyfy</strong> - Sistema de Agendamentos</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template texto para lembrete
   */
  private getReminderText(data: NotificationData): string {
    return `
      LEMBRETE DE AGENDAMENTO
      
      Olá ${data.clientName},
      
      Lembrete do seu agendamento para amanhã:
      
      Serviço: ${data.serviceName}
      Data: ${formatDateToBR(data.appointmentDate)}
      Horário: ${data.appointmentTime}
      
      Lembre-se de chegar com 15 minutos de antecedência.
      
      Timelyfy - Sistema de Agendamentos
    `;
  }

  /**
   * Template HTML para cancelamento
   */
  private getCancellationTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Agendamento Cancelado</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Agendamento Cancelado</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.clientName}</strong>,</p>
              <p>Informamos que seu agendamento foi cancelado:</p>
              
              <div class="appointment-details">
                <div class="detail-row">
                  <span class="detail-label">Serviço:</span>
                  <span class="detail-value">${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Data:</span>
                  <span class="detail-value">${formatDateToBR(data.appointmentDate)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Horário:</span>
                  <span class="detail-value">${data.appointmentTime}</span>
                </div>
              </div>
              
              <p>Para agendar novamente, acesse nossa plataforma.</p>
              
              <div class="footer">
                <p>Este é um email automático, não responda a esta mensagem.</p>
                <p><strong>Timelyfy</strong> - Sistema de Agendamentos</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template texto para cancelamento
   */
  private getCancellationText(data: NotificationData): string {
    return `
      AGENDAMENTO CANCELADO
      
      Olá ${data.clientName},
      
      Seu agendamento foi cancelado:
      
      Serviço: ${data.serviceName}
      Data: ${formatDateToBR(data.appointmentDate)}
      Horário: ${data.appointmentTime}
      
      Para agendar novamente, acesse nossa plataforma.
      
      Timelyfy - Sistema de Agendamentos
    `;
  }

  /**
   * Template HTML para reagendamento
   */
  private getRescheduleTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Agendamento Reagendado</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Agendamento Reagendado</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.clientName}</strong>,</p>
              <p>Seu agendamento foi reagendado para uma nova data:</p>
              
              <div class="appointment-details">
                <div class="detail-row">
                  <span class="detail-label">Serviço:</span>
                  <span class="detail-value">${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Nova Data:</span>
                  <span class="detail-value">${formatDateToBR(data.appointmentDate)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Novo Horário:</span>
                  <span class="detail-value">${data.appointmentTime}</span>
                </div>
              </div>
              
              <p>Por favor, chegue com 15 minutos de antecedência.</p>
              
              <div class="footer">
                <p>Este é um email automático, não responda a esta mensagem.</p>
                <p><strong>Timelyfy</strong> - Sistema de Agendamentos</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Template texto para reagendamento
   */
  private getRescheduleText(data: NotificationData): string {
    return `
      AGENDAMENTO REAGENDADO
      
      Olá ${data.clientName},
      
      Seu agendamento foi reagendado:
      
      Serviço: ${data.serviceName}
      Nova Data: ${formatDateToBR(data.appointmentDate)}
      Novo Horário: ${data.appointmentTime}
      
      Por favor, chegue com 15 minutos de antecedência.
      
      Timelyfy - Sistema de Agendamentos
    `;
  }

  /**
   * Verificar se o serviço de email está funcionando
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Conexão com servidor de email verificada');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão com servidor de email:', error);
      return false;
    }
  }
}

export default new EmailService();