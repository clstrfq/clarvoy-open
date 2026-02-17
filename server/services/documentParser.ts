import * as pdfParseModule from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

const pdfParse = (pdfParseModule as any).default || pdfParseModule;

const SUPPORTED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
};

export function isParseableType(contentType: string): boolean {
  const type = SUPPORTED_TYPES[contentType];
  return !!type && type !== "image";
}

export function getSupportedExtensions(): string[] {
  return [".pdf", ".txt", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"];
}

export async function extractTextFromBuffer(buffer: Buffer, contentType: string): Promise<string> {
  const type = SUPPORTED_TYPES[contentType];

  if (!type) {
    return "";
  }

  switch (type) {
    case "pdf":
      return extractPdf(buffer);
    case "txt":
      return buffer.toString("utf-8").trim();
    case "doc":
    case "docx":
      return extractWord(buffer);
    case "ppt":
    case "pptx":
      return extractPptx(buffer);
    case "xls":
    case "xlsx":
      return extractExcel(buffer);
    case "image":
      return "";
    default:
      return "";
  }
}

async function extractPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (e) {
    console.error("PDF parse error:", e);
    return "[Error extracting PDF text]";
  }
}

async function extractWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (e) {
    console.error("Word parse error:", e);
    return "[Error extracting Word text]";
  }
}

function extractExcel(buffer: Buffer): string {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      sheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
    }
    return sheets.join("\n\n").trim();
  } catch (e) {
    console.error("Excel parse error:", e);
    return "[Error extracting Excel text]";
  }
}

function extractPptx(buffer: Buffer): string {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    if (workbook.SheetNames.length > 0) {
      const sheets: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        sheets.push(`--- Slide: ${sheetName} ---\n${csv}`);
      }
      return sheets.join("\n\n").trim();
    }
    return "[PowerPoint text extraction limited - file uploaded for reference]";
  } catch (e) {
    console.error("PPTX parse error:", e);
    return "[PowerPoint text extraction limited - file uploaded for reference]";
  }
}
