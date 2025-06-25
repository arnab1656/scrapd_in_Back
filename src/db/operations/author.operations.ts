import { Author, Email, PhoneNumber, Content } from '@prisma/client';
import { PrismaService } from '../../lib/prisma';

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
      console.error('Error finding author by name:', error);
      throw error;
    }
  }

  public static async findAuthorByNameAndEmail(
    name: string,
    emails: string[]
  ): Promise<AuthorWithRelations | null> {
    try {
      return await prisma.author.findFirst({
        where: {
          name,
          emails: {
            some: {
              email: {
                email: {
                  in: emails,
                },
              },
            },
          },
        },
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
      console.error('Error finding author by name and emails:', error);
      throw error;
    }
  }

  public static async findAuthorByLinkedInURL(
    linkedInURL: string
  ): Promise<AuthorWithRelations | null> {
    try {
      return await prisma.author.findFirst({
        where: {
          linkedInURL,
        },
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
      console.error('Error finding author by LinkedIn URL:', error);
      throw error;
    }
  }

  public static async authorHasEmail(
    authorId: number,
    email: string
  ): Promise<boolean> {
    try {
      const author = await prisma.author.findFirst({
        where: {
          id: authorId,
          emails: {
            some: {
              email: {
                email,
              },
            },
          },
        },
      });
      return !!author;
    } catch (error) {
      console.error('Error checking if author has email:', error);
      throw error;
    }
  }

  public static async authorHasAnyEmail(
    authorId: number,
    emails: string[]
  ): Promise<boolean> {
    try {
      const author = await prisma.author.findFirst({
        where: {
          id: authorId,
          emails: {
            some: {
              email: {
                email: {
                  in: emails,
                },
              },
            },
          },
        },
      });
      return !!author;
    } catch (error) {
      console.error('Error checking if author has any email:', error);
      throw error;
    }
  }

  public static async createAuthor(
    name: string,
    linkedInURL: string,
    content: string
  ): Promise<Author> {
    try {
      return await prisma.author.create({
        data: {
          name,
          linkedInURL,
          contents: content
            ? {
                create: {
                  content,
                },
              }
            : undefined,
        },
        include: {
          contents: true,
        },
      });
    } catch (error) {
      console.error('Error creating author:', error);
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
      console.error('Error getting author with relations:', error);
      throw error;
    }
  }

  // public static async updateAuthorLinkedInURL(
  //   authorId: number,
  //   newLinkedInURL: string
  // ): Promise<Author> {
  //   try {
  //     return await prisma.author.update({
  //       where: {
  //         id: authorId,
  //       },
  //       data: {
  //         linkedInURL: newLinkedInURL,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error updating author LinkedIn URL:", error);
  //     throw error;
  //   }
  // }
}
