import nodemailer from 'nodemailer';
import { emailConfig } from '../../config/email.config';

export class EmailTransporterService {
  private static instance: EmailTransporterService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = this.createTransporter();
  }

  public static getInstance(): EmailTransporterService {
    if (!EmailTransporterService.instance) {
      EmailTransporterService.instance = new EmailTransporterService();
    }
    return EmailTransporterService.instance;
  }

  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: {
        user: emailConfig.smtp.auth.user,
        pass: emailConfig.smtp.auth.pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  public async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
      encoding: string;
    }>;
  }): Promise<Date> {
    try {
      const mailOptions = {
        from: emailConfig.smtp.auth.user,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || [],
      };

      console.log(
        `Sending email to ${options.to} with subject: ${options.subject}`
      );

      const info = await this.transporter.sendMail(mailOptions);

      const sentAt = new Date();
      console.log(`Email sent successfully to ${options.to} at ${sentAt}`);
      console.log(`Message ID: ${info.messageId}`);

      return sentAt;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  public closeConnection(): void {
    this.transporter.close();
    console.log('SMTP connection closed');
  }
}
