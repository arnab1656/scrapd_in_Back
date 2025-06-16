import { Content } from "@prisma/client";
import { PrismaService } from "../../lib/prisma";

const prisma = PrismaService.getInstance().getClient();

export class ContentOperations {
  public static async createContent(
    authorId: number,
    content: string
  ): Promise<Content> {
    try {
      return await prisma.content.create({
        data: {
          content,
          author: {
            connect: { id: authorId },
          },
        },
      });
    } catch (error) {
      console.error("Error creating content:", error);
      throw error;
    }
  }

  public static async connectContentToEmails(
    contentId: number,
    emailIds: number[]
  ): Promise<void> {
    try {
      await prisma.contentEmail.createMany({
        data: emailIds.map((emailId) => ({
          contentId,
          emailId,
          isEmailSent: false,
        })),
      });
    } catch (error) {
      console.error("Error connecting content to emails:", error);
      throw error;
    }
  }

  public static async getContentWithEmails(
    contentId: number
  ): Promise<Content | null> {
    try {
      return await prisma.content.findUnique({
        where: { id: contentId },
        include: {
          contentEmails: {
            include: {
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error getting content with emails:", error);
      throw error;
    }
  }
}
