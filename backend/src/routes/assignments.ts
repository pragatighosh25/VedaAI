import { Router } from "express";

import multer from "multer";

import {
  listAssignments,
  getAssignment,
  createAssignment,
  deleteAssignment,
  regenerateAssignment,
  getQuestionPaper,
  downloadPdf,
} from "../controllers/assignmentController";

import { authMiddleware } from "../middleware/authMiddleware";

import {
  extractTextFromFile,
  formatExtractedText,
} from "../services/fileExtractionService";

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (
    _req,
    file,
    cb
  ) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (
      allowed.includes(
        file.mimetype
      ) ||
      file.mimetype.startsWith(
        "text/"
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, text, JPEG, PNG allowed"
        )
      );
    }
  },
});

export const assignmentRouter =
  Router();

/* GET ALL ASSIGNMENTS */
assignmentRouter.get(
  "/",
  authMiddleware,
  listAssignments
);

/* GET SINGLE ASSIGNMENT */
assignmentRouter.get(
  "/:id",
  authMiddleware,
  getAssignment
);

/* GET QUESTION PAPER */
assignmentRouter.get(
  "/:id/paper",
  authMiddleware,
  getQuestionPaper
);

/* DOWNLOAD PDF */
assignmentRouter.get(
  "/:id/pdf",
  authMiddleware,
  downloadPdf
);

/* CREATE ASSIGNMENT */
assignmentRouter.post(
  "/",
  authMiddleware,
  upload.single("file"),

  async (
    req,
    res,
    next
  ) => {
    try {
      let uploadedFileText:
        | string
        | undefined;

      let uploadedFileName:
        | string
        | undefined;

      if (req.file) {
        uploadedFileName =
          req.file.originalname;

        try {
          const extraction =
            await extractTextFromFile(
              req.file.buffer,
              req.file.mimetype,
              req.file.originalname
            );
          uploadedFileText =
            formatExtractedText(
              extraction
            );
          console.log(
            `Extracted ${extraction.charCount} chars from ${extraction.fileName} (${extraction.method})`
          );
        } catch (extractionError) {
          console.warn(
            `File extraction failed, proceeding with fallback: ${extractionError instanceof Error ? extractionError.message : "Unknown error"}`
          );
          // Fallback: use filename as context
          uploadedFileText = `[${req.file.mimetype === "application/pdf" ? "PDF" : "File"} uploaded: ${req.file.originalname}. Use teacher instructions for context.]`;
        }
      }

      const body = {
        ...req.body,

        questionTypes:
          typeof req.body
            .questionTypes ===
          "string"
            ? JSON.parse(
                req.body.questionTypes
              )
            : req.body.questionTypes,

        uploadedFileText:
          uploadedFileText ??
          req.body
            .uploadedFileText,

        uploadedFileName,
      };

      req.body = body;

      await createAssignment(
        req,
        res
      );
    } catch (err) {
      next(err);
    }
  }
);

/* DELETE ASSIGNMENT */
assignmentRouter.delete(
  "/:id",
  authMiddleware,
  deleteAssignment
);

/* REGENERATE ASSIGNMENT */
assignmentRouter.post(
  "/:id/regenerate",
  authMiddleware,
  regenerateAssignment
);