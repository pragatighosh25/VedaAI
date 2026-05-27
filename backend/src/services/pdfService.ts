import PDFDocument from "pdfkit";
import type { QuestionPaper } from "../validators/questionPaperSchema";

export interface PdfMeta {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
}

export function generateQuestionPaperPdf(
  paper: QuestionPaper,
  meta: PdfMeta
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text(meta.schoolName, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica").text(`Subject: ${meta.subject}`, { align: "center" });
    doc.text(`Class: ${meta.className}`, { align: "center" });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Time Allowed: ${meta.timeAllowed}`, 50, doc.y, { continued: false });
    const marksY = doc.y - 12;
    doc.text(`Maximum Marks: ${meta.maxMarks}`, 50, marksY, { align: "right", width: 500 });

    doc.moveDown();
    doc.text("All questions are compulsory unless stated otherwise.");
    doc.moveDown();
    doc.text("Name: _________________________");
    doc.text("Roll Number: _________________________");
    doc.text(`Class: ${meta.className}  Section: _________________________`);
    doc.moveDown();

    let qNum = 1;
    for (const section of paper.sections) {
      doc.moveDown();
      doc.fontSize(13).font("Helvetica-Bold").text(section.title, { align: "center" });
      doc.fontSize(11).text(section.instruction, { align: "center" });
      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(10);
      for (const q of section.questions) {
        const diff = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1);
        doc.text(
          `${qNum}. [${diff}] ${q.text} [${q.marks} Mark${q.marks > 1 ? "s" : ""}]`,
          { lineGap: 4 }
        );
        qNum++;
      }
    }

    doc.moveDown(2);
    doc.font("Helvetica-Bold").text("End of Question Paper", { align: "center" });

    doc.end();
  });
}
