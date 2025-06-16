import { Author, Email, PhoneNumber, Content } from "@prisma/client";
import { PrismaService } from "../../lib/prisma";

export type AuthorWithRelations = Author & {
  emails: {
    email: Email;
  }[];
  phoneNumbers: {
    phoneNumber: PhoneNumber;
  }[];
  contents: Content[];
};

const prisma = PrismaService.getInstance().getClient();

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

  public static async createAuthor(
    name: string,
    linkedInURL: string
  ): Promise<Author> {
    try {
      return await prisma.author.create({
        data: {
          name,
          linkedInURL,
        },
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
