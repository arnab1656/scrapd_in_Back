import { PrismaService } from "../../lib/prisma";
import {
  EmailContent,
  EmailProcessingResult,
  QueueItem,
} from "../../types/email.types";
import { StatusManagerService } from "./status-manager.service";


const prisma = PrismaService.getInstance().getClient();

export class EmailProcessorService {
  private static instance: EmailProcessorService;
  private statusManager: StatusManagerService;
 

  private constructor() {
    this.statusManager = StatusManagerService.getInstance();

  }

  public static getInstance(): EmailProcessorService {
    if (!EmailProcessorService.instance) {
      EmailProcessorService.instance = new EmailProcessorService();
    }
    return EmailProcessorService.instance;
  }

  public async processEmail(
    queueItem: QueueItem
  ): Promise<EmailProcessingResult> {
    try {
      // Check current status in database
      const currentStatus = await this.statusManager.checkEmailStatus(
        queueItem.contentId,
        queueItem.emailId
      );

      if (currentStatus.isEmailSent) {
        console.log(
          `Email already sent for content ${queueItem.contentId} and email ${queueItem.emailId}`
        );
        return {
          success: true,
          contentId: queueItem.contentId,
          emailId: queueItem.emailId,
          sentAt: currentStatus.sentAt,
        };
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

      // Send email
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
        error: error instanceof Error ? error.message : "Unknown error",
      };

      // Update status for failure
      await this.statusManager.updateEmailStatus(result);

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
        content: contentEmail.content.content || "",
        email: contentEmail.email.email || "",
        authorName: contentEmail.content.author?.name,
      };
    } catch (error) {
      console.error("Error preparing email content:", error);
      return null;
    }
  }

  private async sendEmail(emailContent: EmailContent): Promise<Date> {
    try {
      // This is a placeholder for actual email sending logic
      // You would integrate with your preferred email service here
      // (e.g., Nodemailer, SendGrid, AWS SES, etc.)

      console.log(
        `Sending email to ${
          emailContent.email
        } with content: ${emailContent.content.substring(0, 100)}...`
      );

      // Simulate email sending delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For now, we'll just log the email details
      // In a real implementation, you would:
      // 1. Use a proper email service
      // 2. Handle SMTP errors
      // 3. Validate email addresses
      // 4. Handle rate limits from the email service

      const sentAt = new Date();
      console.log(
        `Email sent successfully to ${emailContent.email} at ${sentAt}`
      );

      return sentAt;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  public async validateEmailAddress(email: string): Promise<boolean> {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
