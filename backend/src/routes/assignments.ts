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

        if (
          req.file.mimetype ===
          "application/pdf"
        ) {
          uploadedFileText = `[PDF uploaded: ${req.file.originalname}. Use filename and teacher instructions for context.]`;
        } else {
          uploadedFileText =
            req.file.buffer
              .toString("utf-8")
              .slice(0, 8000);
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