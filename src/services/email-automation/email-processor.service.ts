import { PrismaService } from '../../lib/prisma';
import {
  EmailContent,
  EmailProcessingResult,
  QueueItem,
} from '../../types/email.types';
import { StatusManagerService } from './status-manager.service';
import { EmailTransporterService } from './email-transporter.service';
import { TemplateEngine } from '../../utils/template-engine';
import { AttachmentHandler } from '../../utils/attachment-handler';
import { emailConfig } from '../../config/email.config';

const prisma = PrismaService.getInstance().getClient();

export class EmailProcessorService {
  private static instance: EmailProcessorService;
  private statusManager: StatusManagerService;
  private emailTransporter: EmailTransporterService;
  private templateEngine: TemplateEngine;
  private attachmentHandler: AttachmentHandler;

  private constructor() {
    this.statusManager = StatusManagerService.getInstance();
    this.emailTransporter = EmailTransporterService.getInstance();
    this.templateEngine = TemplateEngine.getInstance();
    this.attachmentHandler = AttachmentHandler.getInstance();
  }

  public static getInstance(): EmailProcessorService {
    if (!EmailProcessorService.instance) {
      EmailProcessorService.instance = new EmailProcessorService();
    }
    return EmailProcessorService.instance;
  }

  public async processEmail(
    queueItem: QueueItem,
    onComplete?: () => void
  ): Promise<EmailProcessingResult> {
    try {
      // Check current status in database
      const currentStatus = await this.statusManager.checkEmailStatus(
        queueItem.contentId,
        queueItem.emailId
      );

      // If already sent, skip processing
      if (currentStatus.isEmailSent) {
        console.log(
          `Email already sent for content ${queueItem.contentId} and email ${queueItem.emailId}`
        );

        const result = {
          success: true,
          contentId: queueItem.contentId,
          emailId: queueItem.emailId,
          sentAt: currentStatus.sentAt,
        };

        // Call callback if provided
        if (onComplete) {
          onComplete();
        }

        return result;
      }

      // Prepare email content
      const emailContent = await this.prepareEmailContent(
        queueItem.contentId,
        queueItem.emailId
      );

      if (!emailContent) {
        throw new Error(
          `Failed to prepare email content for content ${queueItem.contentId} and email ${queueItem.emailId}`
        );
      }

      // Send email with real implementation
      const sentAt = await this.sendEmail(emailContent);

      const result: EmailProcessingResult = {
        success: true,
        contentId: queueItem.contentId,
        emailId: queueItem.emailId,
        sentAt,
      };

      // Update status in database
      await this.statusManager.updateEmailStatus(result);

      console.log(
        `Email processed successfully for content ${queueItem.contentId} and email ${queueItem.emailId}`
      );

      // Call callback if provided
      if (onComplete) {
        onComplete();
      }

      return result;
    } catch (error) {
      console.error(
        `Error processing email for content ${queueItem.contentId} and email ${queueItem.emailId}:`,
        error
      );

      const result: EmailProcessingResult = {
        success: false,
        contentId: queueItem.contentId,
        emailId: queueItem.emailId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // Update status for failure
      await this.statusManager.updateEmailStatus(result);

      // Call callback if provided (even on error)
      if (onComplete) {
        onComplete();
      }

      return result;
    }
  }

  private async prepareEmailContent(
    contentId: number,
    emailId: number
  ): Promise<EmailContent | null> {
    try {
      const contentEmail = await prisma.contentEmail.findUnique({
        where: {
          contentId_emailId: {
            contentId,
            emailId,
          },
        },
        include: {
          content: {
            include: {
              author: true,
            },
          },
          email: true,
        },
      });

      if (!contentEmail) {
        throw new Error(`ContentEmail relationship not found`);
      }

      return {
        contentId,
        emailId,
        content: contentEmail.content.content || '',
        email: contentEmail.email.email || '',
        authorName: contentEmail.content.author?.name,
      };
    } catch (error) {
      console.error('Error preparing email content:', error);
      return null;
    }
  }

  private async sendEmail(emailContent: EmailContent): Promise<Date> {
    try {
      // Prepare email components using helper function
      const { subject, htmlContent, attachments } =
        await this.prepareEmailComponents(emailContent);

      // Send email using real SMTP
      const sentAt = await this.emailTransporter.sendEmail({
        to: emailContent.email,
        // to: 'arnab.paul.1656@gmail.com',
        subject,
        html: htmlContent,
        attachments,
      });

      return sentAt;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private async prepareEmailComponents(emailContent: EmailContent): Promise<{
    subject: string;
    htmlContent: string;
    attachments: any[];
  }> {
    // Generate email subject with author name
    const subject = emailConfig.templates.coldEmail.subject.replace(
      '{authorName}',
      emailContent.authorName || 'Unknown'
    );

    // Render HTML template with dynamic content
    const htmlContent = await this.templateEngine.renderTemplate(
      emailConfig.templates.coldEmail.templateName,
      {
        authorName: emailContent.authorName || 'Unknown',
        content: emailContent.content,
      }
    );

    // Prepare attachments
    const attachments = [];

    // Add resume attachment if available
    try {
      const resumeAttachment =
        await this.attachmentHandler.getResumeAttachment();
      attachments.push(resumeAttachment);
    } catch (error) {
      console.warn('Resume attachment not available:', error);
    }

    return { subject, htmlContent, attachments };
  }

  public async validateEmailAddress(email: string): Promise<boolean> {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
