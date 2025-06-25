import { PrismaService } from '../src/lib/prisma';
import { Author, Content, Email, PhoneNumber, ContentEmail, AuthorEmail, AuthorPhone } from '@prisma/client';

const prisma = PrismaService.getInstance().getClient();

interface DuplicateReport {
  tableName: string;
  duplicates: Array<{
    field: string;
    value: string;
    count: number;
    records: any[];
  }>;
  totalDuplicates: number;
}

export class DuplicateChecker {
  private static instance: DuplicateChecker;

  private constructor() {}

  public static getInstance(): DuplicateChecker {
    if (!DuplicateChecker.instance) {
      DuplicateChecker.instance = new DuplicateChecker();
    }
    return DuplicateChecker.instance;
  }

  public async checkAllTables(): Promise<DuplicateReport[]> {
    console.log('🔍 Starting duplicate check for all tables...\n');
    
    const reports: DuplicateReport[] = [];
    
    // Check each table
    reports.push(await this.checkAuthorDuplicates());
    reports.push(await this.checkContentDuplicates());
    reports.push(await this.checkEmailDuplicates());
    reports.push(await this.checkPhoneNumberDuplicates());
    reports.push(await this.checkContentEmailDuplicates());
    reports.push(await this.checkAuthorEmailDuplicates());
    reports.push(await this.checkAuthorPhoneDuplicates());
    
    this.printSummary(reports);
    return reports;
  }

  private async checkAuthorDuplicates(): Promise<DuplicateReport> {
    console.log('📊 Checking Author table duplicates...');
    
    const duplicates: any[] = [];
    
    // Check name duplicates
    const nameDuplicates = await prisma.$queryRaw`
      SELECT name, COUNT(*) as count
      FROM "Author"
      WHERE name IS NOT NULL
      GROUP BY name
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    for (const dup of nameDuplicates as any[]) {
      const records = await prisma.author.findMany({
        where: { name: dup.name },
        include: { emails: { include: { email: true } }, contents: true }
      });
      
      duplicates.push({
        field: 'name',
        value: dup.name,
        count: dup.count,
        records: records
      });
    }
    
    // Check LinkedIn URL duplicates (should be unique)
    const linkedInDuplicates = await prisma.$queryRaw`
      SELECT "linkedInURL", COUNT(*) as count
      FROM "Author"
      WHERE "linkedInURL" IS NOT NULL
      GROUP BY "linkedInURL"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    for (const dup of linkedInDuplicates as any[]) {
      const records = await prisma.author.findMany({
        where: { linkedInURL: dup.linkedInURL },
        include: { emails: { include: { email: true } }, contents: true }
      });
      
      duplicates.push({
        field: 'linkedInURL',
        value: dup.linkedInURL,
        count: dup.count,
        records: records
      });
    }
    
    return {
      tableName: 'Author',
      duplicates,
      totalDuplicates: duplicates.length
    };
  }

  private async checkContentDuplicates(): Promise<DuplicateReport> {
    console.log('📊 Checking Content table duplicates...');
    
    const duplicates: any[] = [];
    
    // Check content text duplicates
    const contentDuplicates = await prisma.$queryRaw`
      SELECT content, COUNT(*) as count
      FROM "Content"
      GROUP BY content
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    for (const dup of contentDuplicates as any[]) {
      const records = await prisma.content.findMany({
        where: { content: dup.content },
        include: { author: true, contentEmails: { include: { email: true } } }
      });
      
      duplicates.push({
        field: 'content',
        value: dup.content.substring(0, 100) + '...',
        count: dup.count,
        records: records
      });
    }
    
    return {
      tableName: 'Content',
      duplicates,
      totalDuplicates: duplicates.length
    };
  }

  private async checkEmailDuplicates(): Promise<DuplicateReport> {
    console.log('📊 Checking Email table duplicates...');
    
    const duplicates: any[] = [];
    
    // Check email duplicates (should be unique)
    const emailDuplicates = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count
      FROM "Email"
      WHERE email IS NOT NULL
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    for (const dup of emailDuplicates as any[]) {
      const records = await prisma.email.findMany({
        where: { email: dup.email },
        include: { authors: { include: { author: true } }, contentEmails: { include: { content: true } } }
      });
      
      duplicates.push({
        field: 'email',
        value: dup.email,
        count: dup.count,
        records: records
      });
    }
    
    return {
      tableName: 'Email',
      duplicates,
      totalDuplicates: duplicates.length
    };
  }

  private async checkPhoneNumberDuplicates(): Promise<DuplicateReport> {
    console.log('📊 Checking PhoneNumber table duplicates...');
    
    const duplicates: any[] = [];
    
    // Check phone number duplicates (should be unique)
    const phoneDuplicates = await prisma.$queryRaw`
      SELECT "phoneNumber", COUNT(*) as count
      FROM "PhoneNumber"
      WHERE "phoneNumber" IS NOT NULL
      GROUP BY "phoneNumber"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    for (const dup of phoneDuplicates as any[]) {
      const records = await prisma.phoneNumber.findMany({
        where: { phoneNumber: dup.phoneNumber },
        include: { authors: { include: { author: true } } }
      });
      
      duplicates.push({
        field: 'phoneNumber',
        value: dup.phoneNumber,
        count: dup.count,
        records: records
      });
    }
    
    return {
      tableName: 'PhoneNumber',
      duplicates,
      totalDuplicates: duplicates.length
    };
  }

  private async checkContentEmailDuplicates(): Promise<DuplicateReport> {
    console.log('📊 Checking ContentEmail table duplicates...');
    
    const duplicates: any[] = [];
    
    // Check content-email relationship duplicates (should be unique)
    const relationshipDuplicates = await prisma.$queryRaw`
      SELECT "contentId", "emailId", COUNT(*) as count
      FROM "ContentEmail"
      GROUP BY "contentId", "emailId"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    for (const dup of relationshipDuplicates as any[]) {
      const records = await prisma.contentEmail.findMany({
        where: { 
          contentId: dup.contentId,
          emailId: dup.emailId
        },
        include: { content: true, email: true }
      });
      
      duplicates.push({
        field: 'contentId-emailId',
        value: `${dup.contentId}-${dup.emailId}`,
        count: dup.count,
        records: records
      });
    }
    
    return {
      tableName: 'ContentEmail',
      duplicates,
      totalDuplicates: duplicates.length
    };
  }

  private async checkAuthorEmailDuplicates(): Promise<DuplicateReport> {
    console.log('📊 Checking AuthorEmail table duplicates...');
    
    const duplicates: any[] = [];
    
    // Check author-email relationship duplicates (should be unique)
    const relationshipDuplicates = await prisma.$queryRaw`
      SELECT "authorId", "emailId", COUNT(*) as count
      FROM "AuthorEmail"
      GROUP BY "authorId", "emailId"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    for (const dup of relationshipDuplicates as any[]) {
      const records = await prisma.authorEmail.findMany({
        where: { 
          authorId: dup.authorId,
          emailId: dup.emailId
        },
        include: { author: true, email: true }
      });
      
      duplicates.push({
        field: 'authorId-emailId',
        value: `${dup.authorId}-${dup.emailId}`,
        count: dup.count,
        records: records
      });
    }
    
    return {
      tableName: 'AuthorEmail',
      duplicates,
      totalDuplicates: duplicates.length
    };
  }

  private async checkAuthorPhoneDuplicates(): Promise<DuplicateReport> {
    console.log('📊 Checking AuthorPhone table duplicates...');
    
    const duplicates: any[] = [];
    
    // Check author-phone relationship duplicates (should be unique)
    const relationshipDuplicates = await prisma.$queryRaw`
      SELECT "authorId", "phoneNumberId", COUNT(*) as count
      FROM "AuthorPhone"
      GROUP BY "authorId", "phoneNumberId"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    for (const dup of relationshipDuplicates as any[]) {
      const records = await prisma.authorPhone.findMany({
        where: { 
          authorId: dup.authorId,
          phoneNumberId: dup.phoneNumberId
        },
        include: { author: true, phoneNumber: true }
      });
      
      duplicates.push({
        field: 'authorId-phoneNumberId',
        value: `${dup.authorId}-${dup.phoneNumberId}`,
        count: dup.count,
        records: records
      });
    }
    
    return {
      tableName: 'AuthorPhone',
      duplicates,
      totalDuplicates: duplicates.length
    };
  }

  private printSummary(reports: DuplicateReport[]): void {
    console.log('\n📋 DUPLICATE CHECK SUMMARY');
    console.log('=' .repeat(50));
    
    let totalIssues = 0;
    
    for (const report of reports) {
      console.log(`\n📊 ${report.tableName}: ${report.totalDuplicates} duplicate issues found`);
      
      if (report.duplicates.length > 0) {
        for (const dup of report.duplicates) {
          console.log(`  ❌ ${dup.field}: "${dup.value}" (${dup.count} occurrences)`);
          totalIssues += dup.count - 1; // Count actual duplicates, not total records
        }
      } else {
        console.log(`  ✅ No duplicates found`);
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`🎯 TOTAL DUPLICATE RECORDS: ${totalIssues}`);
    
    if (totalIssues === 0) {
      console.log('🎉 EXCELLENT! No duplicates found in the database!');
    } else {
      console.log('⚠️  Duplicates found! Consider cleaning up the data.');
    }
  }

  public async generateDetailedReport(): Promise<void> {
    console.log('📄 Generating detailed duplicate report...\n');
    
    const reports = await this.checkAllTables();
    
    // Save detailed report to file
    const fs = require('fs');
    const reportData = {
      timestamp: new Date().toISOString(),
      reports: reports
    };
    
    fs.writeFileSync(
      'test/duplicate-report.json',
      JSON.stringify(reportData, null, 2)
    );
    
    console.log('📄 Detailed report saved to: test/duplicate-report.json');
  }
} 