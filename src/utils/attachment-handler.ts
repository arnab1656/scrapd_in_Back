import * as fs from 'fs';
import * as path from 'path';

export interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
  encoding: string;
}

export class AttachmentHandler {
  private static instance: AttachmentHandler;
  private readonly resumePath: string;

  private constructor() {
    // Path to the resume PDF file
    this.resumePath = path.join(
      __dirname,
      '../assets/Arnab_Paul_Full_Stack_Resume.pdf'
    );
  }

  public static getInstance(): AttachmentHandler {
    if (!AttachmentHandler.instance) {
      AttachmentHandler.instance = new AttachmentHandler();
    }
    return AttachmentHandler.instance;
  }

  public async getResumeAttachment(): Promise<Attachment> {
    try {
      const content = await fs.promises.readFile(this.resumePath);

      return {
        filename: 'Arnab_Paul_Full_Stack_Resume.pdf',
        content,
        contentType: 'application/pdf',
        encoding: 'binary',
      };
    } catch (error) {
      console.error('Error reading resume file:', error);
      throw new Error('Resume file not found or cannot be read');
    }
  }

  public async getAttachment(
    filePath: string,
    filename?: string
  ): Promise<Attachment> {
    try {
      const content = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();

      let contentType = 'application/octet-stream';
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.doc':
          contentType = 'application/msword';
          break;
        case '.docx':
          contentType =
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
      }

      return {
        filename: filename || path.basename(filePath),
        content,
        contentType,
        encoding: 'binary',
      };
    } catch (error) {
      console.error(`Error reading attachment file ${filePath}:`, error);
      throw new Error(
        `Attachment file ${filePath} not found or cannot be read`
      );
    }
  }

  public async checkResumeExists(): Promise<boolean> {
    try {
      await fs.promises.access(this.resumePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
