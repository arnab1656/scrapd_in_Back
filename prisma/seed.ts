import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Create first author with 3 emails and 3 phone numbers
    const author1 = await prisma.author.create({
      data: {
        name: "John Doe",
        linkedInURL: "https://linkedin.com/in/johndoe",
      },
    });

    // Create second author with 2 emails and 2 phone numbers
    const author2 = await prisma.author.create({
      data: {
        name: "Jane Smith",
        linkedInURL: "https://linkedin.com/in/janesmith",
      },
    });

    // Create phone numbers for author1 (3 numbers)
    const phone1 = await prisma.phoneNumber.create({
      data: { phoneNumber: "+1234567890" },
    });
    const phone2 = await prisma.phoneNumber.create({
      data: { phoneNumber: "+1234567891" },
    });
    const phone3 = await prisma.phoneNumber.create({
      data: { phoneNumber: "+1234567892" },
    });

    // Create phone numbers for author2 (2 numbers)
    const phone4 = await prisma.phoneNumber.create({
      data: { phoneNumber: "+1987654321" },
    });
    const phone5 = await prisma.phoneNumber.create({
      data: { phoneNumber: "+1987654322" },
    });

    // Create emails for author1 (3 emails)
    const email1 = await prisma.email.create({
      data: { email: "john.doe@example.com" },
    });
    const email2 = await prisma.email.create({
      data: { email: "john.work@example.com" },
    });
    const email3 = await prisma.email.create({
      data: { email: "john.personal@example.com" },
    });

    // Create emails for author2 (2 emails)
    const email4 = await prisma.email.create({
      data: { email: "jane.smith@example.com" },
    });
    const email5 = await prisma.email.create({
      data: { email: "jane.work@example.com" },
    });

    // Link author1 with all 3 phones
    await prisma.authorPhone.create({
      data: { authorId: author1.id, phoneNumberId: phone1.id },
    });
    await prisma.authorPhone.create({
      data: { authorId: author1.id, phoneNumberId: phone2.id },
    });
    await prisma.authorPhone.create({
      data: { authorId: author1.id, phoneNumberId: phone3.id },
    });

    // Link author2 with 2 phones
    await prisma.authorPhone.create({
      data: { authorId: author2.id, phoneNumberId: phone4.id },
    });
    await prisma.authorPhone.create({
      data: { authorId: author2.id, phoneNumberId: phone5.id },
    });

    // Link author1 with all 3 emails
    await prisma.authorEmail.create({
      data: { authorId: author1.id, emailId: email1.id },
    });
    await prisma.authorEmail.create({
      data: { authorId: author1.id, emailId: email2.id },
    });
    await prisma.authorEmail.create({
      data: { authorId: author1.id, emailId: email3.id },
    });

    // Link author2 with 2 emails
    await prisma.authorEmail.create({
      data: { authorId: author2.id, emailId: email4.id },
    });
    await prisma.authorEmail.create({
      data: { authorId: author2.id, emailId: email5.id },
    });

    // Create 2 contents for author1
    const content1 = await prisma.content.create({
      data: {
        content: "First content from John Doe about technology trends",
        authorId: author1.id,
      },
    });

    const content2 = await prisma.content.create({
      data: {
        content: "Second content from John Doe about business insights",
        authorId: author1.id,
      },
    });

    // Create 1 content for author2
    const content3 = await prisma.content.create({
      data: {
        content: "Content from Jane Smith about marketing strategies",
        authorId: author2.id,
      },
    });

    // Link content1 with all 3 emails (sent)
    await prisma.contentEmail.create({
      data: {
        contentId: content1.id,
        emailId: email1.id,
        isEmailSent: true,
        sentAt: new Date(),
      },
    });
    await prisma.contentEmail.create({
      data: {
        contentId: content1.id,
        emailId: email2.id,
        isEmailSent: true,
        sentAt: new Date(),
      },
    });
    await prisma.contentEmail.create({
      data: {
        contentId: content1.id,
        emailId: email3.id,
        isEmailSent: true,
        sentAt: new Date(),
      },
    });

    // Link content2 with all 3 emails (not sent)
    await prisma.contentEmail.create({
      data: {
        contentId: content2.id,
        emailId: email1.id,
        isEmailSent: false,
      },
    });
    await prisma.contentEmail.create({
      data: {
        contentId: content2.id,
        emailId: email2.id,
        isEmailSent: false,
      },
    });
    await prisma.contentEmail.create({
      data: {
        contentId: content2.id,
        emailId: email3.id,
        isEmailSent: false,
      },
    });

    // Link content3 with 2 emails (sent)
    await prisma.contentEmail.create({
      data: {
        contentId: content3.id,
        emailId: email4.id,
        isEmailSent: true,
        sentAt: new Date(),
      },
    });
    await prisma.contentEmail.create({
      data: {
        contentId: content3.id,
        emailId: email5.id,
        isEmailSent: true,
        sentAt: new Date(),
      },
    });

    console.log("Seed data created successfully");
    console.log("Created authors:", { author1, author2 });
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
