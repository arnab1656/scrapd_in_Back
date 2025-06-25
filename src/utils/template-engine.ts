import * as fs from 'fs';
import * as path from 'path';

export class TemplateEngine {
  private static instance: TemplateEngine;
  private templates: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine();
    }
    return TemplateEngine.instance;
  }

  public async loadTemplate(templateName: string): Promise<string> {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName)!;
    }

    const templatePath = path.join(
      __dirname,
      '../templates/email-templates',
      `${templateName}.html`
    );

    try {
      const template = await fs.promises.readFile(templatePath, 'utf-8');
      this.templates.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  public render(template: string, data: Record<string, any>): string {
    let rendered = template;

    // Replace placeholders with data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value || '');
    }

    return rendered;
  }

  public async renderTemplate(
    templateName: string,
    data: Record<string, any>
  ): Promise<string> {
    const template = await this.loadTemplate(templateName);
    return this.render(template, data);
  }
}
