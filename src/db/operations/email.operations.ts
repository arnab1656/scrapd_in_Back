import { Email } from "@prisma/client";
import { PrismaService } from "../../lib/prisma";

const prisma = PrismaService.getInstance().getClient();

export class EmailOperations {
  public static async findOrCreateEmail(email: string): Promise<Email> {
    try {
      return await prisma.email.upsert({
        where: { email },
        update: {},
        create: { email },
      });
    } catch (error) {
      console.error("Error finding or creating email:", error);
      throw error;
    }
  }

  public static async connectEmailToAuthor(
    authorId: number,
    emailId: number
  ): Promise<void> {
    try {
      const existingRelation = await prisma.authorEmail.findFirst({
        where: {
          authorId,
          emailId,
        },
      });

      if (existingRelation) {
        console.log("Email is already connected to the author");
        return;
      }

      await prisma.authorEmail.create({
        data: {
          authorId,
          emailId,
        },
      });
      console.log("Successfully connected email to author");
    } catch (error) {
      console.error("Error connecting email to author:", error);
    }
  }
}
