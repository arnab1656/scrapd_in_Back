import { Content } from "@prisma/client";
import {
  AuthorOperations,
  AuthorWithRelations,
} from "../operations/author.operations";
import { EmailOperations } from "../operations/email.operations";
import { PhoneOperations } from "../operations/phone.operations";
import { ContentOperations } from "../operations/content.operations";
import { PrismaService } from "../../lib/prisma";

export interface AuthorInput {
  name: string;
  emails: string[];
  phoneNumbers: string[];
  content: string;
  linkedInURL: string;
}

const prisma = PrismaService.getInstance().getClient();

export class AuthorService {
  public static async createOrGetAuthorWithRelations({
    name,
    emails,
    phoneNumbers,
    content,
    linkedInURL,
  }: AuthorInput): Promise<AuthorWithRelations> {
    try {
      // 1. Create/Get Author
      const author = await prisma.$transaction(async () => {
        let author = await AuthorOperations.findAuthorByName(name);
        if (!author) {
          author = (await AuthorOperations.createAuthor(
            name,
            linkedInURL
          )) as AuthorWithRelations;
        }
        return author;
      });

      // 2. Process Emails
      await prisma.$transaction(async () => {
        const emailPromises = emails.map(async (email) => {
          const emailRecord = await EmailOperations.findOrCreateEmail(email);
          await EmailOperations.connectEmailToAuthor(author.id, emailRecord.id);
        });
        await Promise.all(emailPromises);
      });

      // 3. Process Phones - Sequentially to avoid race conditions
      for (const phone of phoneNumbers) {
        await prisma.$transaction(async () => {
          const phoneRecord = await PhoneOperations.findOrCreatePhone(phone);
          await PhoneOperations.connectPhoneToAuthor(author.id, phoneRecord.id);
        });
      }

      // 4. Create Content
      if (content) {
        await prisma.$transaction(async () => {
          const contentRecord = await ContentOperations.createContent(
            author.id,
            content
          );
          const authorEmails = await EmailOperations.findEmailsByAuthorId(
            author.id
          );
          await ContentOperations.connectContentToEmails(
            contentRecord.id,
            authorEmails.map((e) => e.id)
          );
        });
      }

      // 5. Get final result
      const authorWithRelations = await AuthorOperations.getAuthorWithRelations(
        author.id
      );
      if (!authorWithRelations) {
        throw new Error(
          "Failed to retrieve author with relations after creation"
        );
      }

      return authorWithRelations;
    } catch (error) {
      console.error("Error in createOrGetAuthorWithRelations:", error);
      throw error;
    }
  }

  // Get author with all relations
  public static async getAuthorWithAllRelations(
    authorId: number
  ): Promise<AuthorWithRelations | null> {
    try {
      return await AuthorOperations.getAuthorWithRelations(authorId);
    } catch (error) {
      console.error("Error getting author with all relations:", error);
      throw error;
    }
  }

  public static async updateAuthorContent(
    authorId: number,
    content: string
  ): Promise<Content> {
    try {
      return await ContentOperations.createContent(authorId, content);
    } catch (error) {
      console.error("Error updating author content:", error);
      throw error;
    }
  }
}
