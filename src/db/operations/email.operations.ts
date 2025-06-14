import { Email } from "@prisma/client";
import { prisma } from "../../lib/prisma";

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
      await prisma.authorEmail.create({
        data: {
          authorId,
          emailId,
        },
      });
    } catch (error) {
      console.error("Error connecting email to author:", error);
      throw error;
    }
  }

  public static async findEmailsByAuthorId(authorId: number): Promise<Email[]> {
    try {
      const authorEmails = await prisma.authorEmail.findMany({
        where: { authorId },
        include: { email: true },
      });
      return authorEmails.map((ae) => ae.email);
    } catch (error) {
      console.error("Error finding emails by author ID:", error);
      throw error;
    }
  }
}
