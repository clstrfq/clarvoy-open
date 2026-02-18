import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const STORED_FILE_NAME_RE = /^[0-9a-fA-F-]{36}\.[a-zA-Z0-9]+$/;

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
    const filePath = this.resolveSafeUploadPath(fileName);
    return await fs.promises.readFile(filePath);
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = this.resolveSafeUploadPath(fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  getFilePath(fileName: string): string {
    return this.resolveSafeUploadPath(fileName);
  }

  isStoredFileNameSafe(fileName: string): boolean {
    return STORED_FILE_NAME_RE.test(fileName);
  }

  private resolveSafeUploadPath(fileName: string): string {
    if (!this.isStoredFileNameSafe(fileName)) {
      throw new Error("Invalid upload file name");
    }
    const resolved = path.resolve(UPLOAD_DIR, fileName);
    if (!resolved.startsWith(`${UPLOAD_DIR}${path.sep}`)) {
      throw new Error("Unsafe upload file path");
    }
    return resolved;
  }
}

export const fileStorage = new FileStorageService();
