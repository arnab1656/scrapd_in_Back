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
  static async createOrGetAuthorWithRelations(
    authorData: AuthorInput
  ): Promise<AuthorWithRelations> {
    try {
      const author = await prisma.$transaction(async (tx) => {
        const existingAuthor = await AuthorOperations.findAuthorByName(
          authorData.name
        );

        if (existingAuthor) {
          console.log("Found existing author:", existingAuthor.id);
          await tx.content.create({
            data: {
              content: authorData.content || "",
              authorId: existingAuthor.id,
            },
          });
          console.log(
            "Added new content to existing author:",
            existingAuthor.id
          );
          return existingAuthor;
        }

        const newAuthor = await tx.author.create({
          data: {
            name: authorData.name,
            linkedInURL: authorData.linkedInURL,
            contents: {
              create: {
                content: authorData.content || "",
              },
            },
          },
          include: {
            contents: true,
          },
        });

        return newAuthor;
      });

      if (authorData.emails && authorData.emails.length > 0) {
        console.log("Processing emails for author:", author.id);
        for (const email of authorData.emails) {
          try {
            await prisma.$transaction(async () => {
              console.log(`Processing email: ${email}`);
              const emailRecord = await EmailOperations.findOrCreateEmail(
                email
              );
              await EmailOperations.connectEmailToAuthor(
                author.id,
                emailRecord.id
              );
              console.log(`Successfully processed email: ${email}`);
            });
          } catch (error) {
            console.error(`Error processing email ${email}:`, error);
          }
        }
      } else {
        console.log("No emails provided for author:", author.id);
      }

      if (authorData.phoneNumbers && authorData.phoneNumbers.length > 0) {
        console.log("Processing phone numbers for author:", author.id);
        for (const phone of authorData.phoneNumbers) {
          try {
            await prisma.$transaction(async () => {
              console.log(`Processing phone: ${phone}`);
              const phoneRecord = await PhoneOperations.findOrCreatePhone(
                phone
              );
              await PhoneOperations.connectPhoneToAuthor(
                author.id,
                phoneRecord.id
              );
              console.log(`Successfully processed phone: ${phone}`);
            });
          } catch (error) {
            console.error(`Error processing phone ${phone}:`, error);
          }
        }
      } else {
        console.log("No phone numbers provided for author:", author.id);
      }

      const completeAuthor = await AuthorOperations.getAuthorWithRelations(
        author.id
      );
      if (!completeAuthor) {
        throw new Error(
          `Failed to fetch complete author data for ID: ${author.id}`
        );
      }

      return completeAuthor;
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
