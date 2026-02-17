import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class FileStorageService {
  async saveFile(buffer: Buffer, originalName: string): Promise<string> {
    const fileId = randomUUID();
    const ext = path.extname(originalName);
    const fileName = `${fileId}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    await fs.promises.writeFile(filePath, buffer);
    return fileName;
  }

  async readFile(fileName: string): Promise<Buffer> {
    const filePath = path.join(UPLOAD_DIR, fileName);
    return await fs.promises.readFile(filePath);
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  getFilePath(fileName: string): string {
    return path.join(UPLOAD_DIR, fileName);
  }
}

export const fileStorage = new FileStorageService();
