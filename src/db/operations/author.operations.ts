import { Author, Email, PhoneNumber, Content } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export type AuthorWithRelations = Author & {
  emails: {
    email: Email;
  }[];
  phoneNumbers: {
    phoneNumber: PhoneNumber;
  }[];
  contents: Content[];
};

export class AuthorOperations {
  public static async findAuthorByName(
    name: string
  ): Promise<AuthorWithRelations | null> {
    try {
      return await prisma.author.findFirst({
        where: { name },
        include: {
          emails: {
            include: {
              email: true,
            },
          },
          phoneNumbers: {
            include: {
              phoneNumber: true,
            },
          },
          contents: true,
        },
      });
    } catch (error) {
      console.error("Error finding author by name:", error);
      throw error;
    }
  }

  public static async createAuthor(name: string): Promise<Author> {
    try {
      return await prisma.author.create({
        data: { name },
      });
    } catch (error) {
      console.error("Error creating author:", error);
      throw error;
    }
  }

  public static async getAuthorWithRelations(
    authorId: number
  ): Promise<AuthorWithRelations | null> {
    try {
      return await prisma.author.findUnique({
        where: { id: authorId },
        include: {
          emails: {
            include: {
              email: true,
            },
          },
          phoneNumbers: {
            include: {
              phoneNumber: true,
            },
          },
          contents: true,
        },
      });
    } catch (error) {
      console.error("Error getting author with relations:", error);
      throw error;
    }
  }
}
