import { PhoneNumber } from '@prisma/client';
import { PrismaService } from '../../lib/prisma';

const prisma = PrismaService.getInstance().getClient();

export class PhoneOperations {
  public static async findOrCreatePhone(
    phoneNumber: string | null
  ): Promise<PhoneNumber> {
    try {
      const phoneValue = phoneNumber === null ? '' : phoneNumber;

      return await prisma.phoneNumber.upsert({
        where: { phoneNumber: phoneValue },
        update: {},
        create: { phoneNumber: phoneValue },
      });
    } catch (error) {
      console.error('Error finding or creating phone:', error);
      throw error;
    }
  }

  public static async connectPhoneToAuthor(
    authorId: number,
    phoneNumberId: number
  ): Promise<void> {
    try {
      const existingRelation = await prisma.authorPhone.findFirst({
        where: {
          authorId,
          phoneNumberId,
        },
      });

      if (existingRelation) {
        return;
      }

      await prisma.authorPhone.create({
        data: {
          authorId,
          phoneNumberId,
        },
      });
    } catch (error) {
      console.error('Error connecting phone number to author:', error);
    }
  }
}
