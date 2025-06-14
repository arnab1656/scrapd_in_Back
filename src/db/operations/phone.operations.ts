import { PhoneNumber } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export class PhoneOperations {
  public static async findOrCreatePhone(
    phoneNumber: string
  ): Promise<PhoneNumber> {
    try {
      // First try to find the phone number
      const existingPhone = await prisma.phoneNumber.findUnique({
        where: { phoneNumber },
      });

      if (existingPhone) {
        return existingPhone;
      }

      // If not found, create new
      return await prisma.phoneNumber.create({
        data: { phoneNumber },
      });
    } catch (error) {
      console.error("Error finding or creating phone:", error);
      throw error;
    }
  }

  public static async connectPhoneToAuthor(
    authorId: number,
    phoneNumberId: number
  ): Promise<void> {
    try {
      // Check if connection already exists
      const existingConnection = await prisma.authorPhone.findUnique({
        where: {
          authorId_phoneNumberId: {
            authorId,
            phoneNumberId,
          },
        },
      });

      // Only create if connection doesn't exist
      if (!existingConnection) {
        await prisma.authorPhone.create({
          data: {
            authorId,
            phoneNumberId,
          },
        });
      }
    } catch (error) {
      console.error("Error connecting phone to author:", error);
      throw error;
    }
  }

  public static async findPhonesByAuthorId(
    authorId: number
  ): Promise<PhoneNumber[]> {
    try {
      const authorPhones = await prisma.authorPhone.findMany({
        where: { authorId },
        include: { phoneNumber: true },
      });
      return authorPhones.map((ap) => ap.phoneNumber);
    } catch (error) {
      console.error("Error finding phones by author ID:", error);
      throw error;
    }
  }
}
