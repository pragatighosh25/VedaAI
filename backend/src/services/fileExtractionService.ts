import Tesseract from "tesseract.js";
import sharp from "sharp";

// Use dynamic require for pdf-parse
const PDFParser = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; version: string }>;

export interface ExtractionResult {
  text: string;
  method: "pdf" | "image" | "text" | "unknown";
  fileName: string;
  charCount: number;
}

/**
 * Extract text from a PDF buffer
 */
async function extractFromPdf(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  try {
    const data = await PDFParser(buffer);
    const fullText = data.text || "";

    // Limit to first 8000 chars to avoid overwhelming the AI prompt
    const limitedText = fullText.slice(0, 8000);

    return {
      text: limitedText,
      method: "pdf",
      fileName,
      charCount: fullText.length,
    };
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Extract text from an image using OCR
 */
async function extractFromImage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractionResult> {
  try {
    // Optimize image size before OCR
    const optimized = await sharp(buffer)
      .resize(2000, 2000, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .grayscale() // Convert to grayscale for better OCR
      .toBuffer();

    // Run Tesseract OCR with timeout
    const ocrPromise = Tesseract.recognize(optimized, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Set a 30-second timeout for OCR
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => reject(new Error("OCR processing timed out after 30 seconds")), 30000);
    });

    const {
      data: { text },
    } = await Promise.race([ocrPromise, timeoutPromise]);

    // Limit to first 8000 chars
    const limitedText = text.slice(0, 8000);

    return {
      text: limitedText,
      method: "image",
      fileName,
      charCount: text.length,
    };
  } catch (error) {
    console.error("Image OCR extraction failed:", error);
    throw new Error(
      `Failed to extract text from image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from plain text file
 */
function extractFromText(buffer: Buffer, fileName: string): ExtractionResult {
  try {
    const text = buffer.toString("utf-8");
    // Limit to first 8000 chars
    const limitedText = text.slice(0, 8000);

    return {
      text: limitedText,
      method: "text",
      fileName,
      charCount: text.length,
    };
  } catch (error) {
    console.error("Text extraction failed:", error);
    throw new Error(
      `Failed to extract text from file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Main function to extract text from any supported file type
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractionResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty file buffer");
  }

  // Route based on MIME type
  if (mimeType === "application/pdf") {
    return extractFromPdf(buffer, fileName);
  }

  if (mimeType === "image/jpeg" || mimeType === "image/png") {
    return extractFromImage(buffer, fileName, mimeType);
  }

  if (mimeType.startsWith("text/")) {
    return extractFromText(buffer, fileName);
  }

  // Default fallback: try as text
  return extractFromText(buffer, fileName);
}

/**
 * Format extracted text for use in AI prompt
 */
export function formatExtractedText(result: ExtractionResult): string {
  const methodLabel =
    {
      pdf: "PDF document",
      image: "image (OCR)",
      text: "text file",
      unknown: "uploaded file",
    }[result.method] || "uploaded file";

  return `Reference material from ${methodLabel} (${result.fileName}):\n\n${result.text}`;
}
