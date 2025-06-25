import { ContentEmail } from '@prisma/client';
import { PrismaService } from '../../lib/prisma';

const prisma = PrismaService.getInstance().getClient();

export class ContentEmailOperations {
  public static async connectEmailToContent(
    contentId: number,
    emailId: number
  ): Promise<ContentEmail> {
    try {
      const existingRelation = await prisma.contentEmail.findFirst({
        where: {
          contentId,
          emailId,
        },
      });

      if (existingRelation) {
        return existingRelation;
      }

      const contentEmail = await prisma.contentEmail.create({
        data: {
          contentId,
          emailId,
          isEmailSent: false,
        },
      });

      return contentEmail;
    } catch (error) {
      console.error('Error connecting email to content:');
      throw error;
    }
  }

  public static async markEmailAsSent(
    contentId: number,
    emailId: number
  ): Promise<ContentEmail> {
    try {
      const contentEmail = await prisma.contentEmail.update({
        where: {
          contentId_emailId: {
            contentId,
            emailId,
          },
        },
        data: {
          isEmailSent: true,
          sentAt: new Date(),
        },
      });

      return contentEmail;
    } catch (error) {
      console.error('Error marking email as sent:', error);
      throw error;
    }
  }

  public static async getUnsentEmailsForContent(
    contentId: number
  ): Promise<
    (ContentEmail & { email: { id: number; email: string | null } })[]
  > {
    try {
      return await prisma.contentEmail.findMany({
        where: {
          contentId,
          isEmailSent: false,
        },
        include: {
          email: true,
        },
      });
    } catch (error) {
      console.error('Error getting unsent emails for content:', error);
      throw error;
    }
  }

  public static async getContentEmailConnections(
    contentId: number
  ): Promise<ContentEmail[]> {
    try {
      return await prisma.contentEmail.findMany({
        where: {
          contentId,
        },
      });
    } catch (error) {
      console.error('Error getting content email connections:', error);
      throw error;
    }
  }

  // public static async isEmailSentForContent(
  //   contentId: number,
  //   emailId: number
  // ): Promise<boolean> {
  //   try {
  //     const contentEmail = await prisma.contentEmail.findUnique({
  //       where: {
  //         contentId_emailId: {
  //           contentId,
  //           emailId,
  //         },
  //       },
  //     });

  //     return contentEmail?.isEmailSent || false;
  //   } catch (error) {
  //     console.error("Error checking if email is sent for content:", error);
  //     throw error;
  //   }
  // }
}
