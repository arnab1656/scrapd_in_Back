import { Content } from "@prisma/client";
import { PrismaService } from "../../lib/prisma";

const prisma = PrismaService.getInstance().getClient();

export class ContentOperations {
  public static async findContentByString(
    contentString: string
  ): Promise<Content | null> {
    try {
      return await prisma.content.findFirst({
        where: {
          content: contentString,
        },
      });
    } catch (error) {
      console.error("Error finding content by string:", error);
      throw error;
    }
  }

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
}
