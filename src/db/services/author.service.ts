import {
  AuthorOperations,
  AuthorWithRelations,
} from '../operations/author.operations';
import { EmailOperations } from '../operations/email.operations';
import { PhoneOperations } from '../operations/phone.operations';
import { ContentOperations } from '../operations/content.operations';
import { PrismaService } from '../../lib/prisma';
import { ContentEmailOperations } from '../operations/contentEmail.operations';

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
      const author = await prisma.$transaction(
        async tx => {
          const existingAuthorByName = await AuthorOperations.findAuthorByName(
            authorData.name
          );

          if (existingAuthorByName) {
            // Check if LinkedIn URL matches with existing author
            if (
              authorData.linkedInURL &&
              existingAuthorByName.linkedInURL === authorData.linkedInURL
            ) {
              // Check if content already exists for this author
              const existingContentForAuthor =
                await ContentOperations.findContentByString(authorData.content);

              if (existingContentForAuthor) {
                return existingAuthorByName;
              } else {
                await tx.content.create({
                  data: {
                    content: authorData.content || '',
                    authorId: existingAuthorByName.id,
                  },
                });
                return existingAuthorByName;
              }
            } else {
              const newAuthor = await AuthorOperations.createAuthor(
                authorData.name,
                authorData.linkedInURL,
                authorData.content
              );
              return newAuthor;
            }
          } else {
            //_here we will create a new author with the details passed as the authorData
            console.log(`Creating new author with name "${authorData.name}"`);
            const newAuthor = await AuthorOperations.createAuthor(
              authorData.name,
              authorData.linkedInURL,
              authorData.content
            );
            return newAuthor;
          }
        },
        {
          timeout: 30000,
        }
      );

      if (authorData.emails && authorData.emails.length > 0) {
        for (const email of authorData.emails) {
          try {
            await prisma.$transaction(
              async () => {
                const emailRecord =
                  await EmailOperations.findOrCreateEmail(email);
                await EmailOperations.connectEmailToAuthor(
                  author.id,
                  emailRecord.id
                );
              },
              {
                timeout: 10000,
              }
            );
          } catch (error) {
            console.error(`Error processing email ${email}:`, error);
          }
        }
      }

      if (authorData.phoneNumbers && authorData.phoneNumbers.length > 0) {
        for (const phone of authorData.phoneNumbers) {
          try {
            await prisma.$transaction(
              async () => {
                const phoneRecord =
                  await PhoneOperations.findOrCreatePhone(phone);
                await PhoneOperations.connectPhoneToAuthor(
                  author.id,
                  phoneRecord.id
                );
              },
              {
                timeout: 10000,
              }
            );
          } catch (error) {
            console.error(`Error processing phone ${phone}:`, error);
          }
        }
      }

      if (authorData.content && authorData.emails.length > 0) {
        const existingContent = await ContentOperations.findContentByString(
          authorData.content
        );

        if (existingContent) {
          const contentEmailConnections =
            await ContentEmailOperations.getContentEmailConnections(
              existingContent.id
            );

          if (contentEmailConnections.length > 0) {
            // Re-entry: Content already connected to emails, skip connection
          } else {
            for (const email of authorData.emails) {
              try {
                await prisma.$transaction(
                  async () => {
                    const emailRecord =
                      await EmailOperations.findOrCreateEmail(email);

                    console.log(
                      'Got Email record and name connecting content to email ---> ',
                      emailRecord.id,
                      emailRecord.email
                    );

                    await ContentEmailOperations.connectEmailToContent(
                      existingContent.id,
                      emailRecord.id
                    );
                  },
                  {
                    timeout: 10000,
                  }
                );
              } catch (error) {
                console.error('Error in connecting email to content:', error);
              }
            }
          }
        } else {
          console.log(
            `Content not found in database, this is unexpected. Creating content-email connections.`
          );
        }
      }

      const completeAuthor = await prisma.$transaction(
        async () => {
          const completeAuthorDetails =
            await AuthorOperations.getAuthorWithRelations(author.id);

          if (!completeAuthorDetails) {
            throw new Error(
              `Failed to fetch complete author data for ID: ${author.id}`
            );
          }
          return completeAuthorDetails;
        },
        {
          timeout: 15000,
        }
      );

      return completeAuthor;
    } catch (error) {
      console.error('Error in fetching complete author details:', error);
      throw error;
    }
  }
}
