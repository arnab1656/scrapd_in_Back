import { PhoneNumber } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export class PhoneOperations {
  public static async findOrCreatePhone(
    phoneNumber: string
  ): Promise<PhoneNumber> {
    try {
      return await prisma.phoneNumber.upsert({
        where: { phoneNumber },
        update: {},
        create: { phoneNumber },
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
      await prisma.authorPhone.create({
        data: {
          authorId,
          phoneNumberId,
        },
      });
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
