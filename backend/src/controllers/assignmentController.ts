import type {
  Response,
  NextFunction,
} from "express";

import { z } from "zod";

import { Assignment } from "../models/Assignment";

import { User } from "../models/User";

import { enqueueGeneration } from "../queues/generationQueue";

import { getCached } from "../utils/redis";
import { deleteCache } from "../utils/redis";

import { questionPaperSchema } from "../validators/questionPaperSchema";

import { generateQuestionPaperPdf } from "../services/pdfService";

import { AuthRequest } from "../middleware/authMiddleware";

const questionTypeSchema = z.object({
  type: z.string().min(1),

  count: z.number().int().positive(),

  marksPerQuestion:
    z.number().positive(),
});

const createAssignmentSchema =
  z.object({
    title: z.string().min(1).optional(),

    dueDate: z.string().min(1),

    questionTypes: z
      .array(questionTypeSchema)
      .min(1),

    additionalInstructions:
      z.string().optional(),

    uploadedFileText:
      z.string().optional(),

    uploadedFileName:
      z.string().optional(),
  });

/* LIST ASSIGNMENTS */
export async function listAssignments(
  req: AuthRequest,
  res: Response
) {
  const assignments =
    await Assignment.find({
      user: req.userId,
    })
      .sort({
        createdAt: -1,
      })
      .select(
        "-uploadedFileText -questionPaper"
      );

  res.json(assignments);
}

/* GET SINGLE ASSIGNMENT */
export async function getAssignment(
  req: AuthRequest,
  res: Response
) {
  const assignment =
    await Assignment.findOne({
      _id: req.params.id,
      user: req.userId,
    });

  if (!assignment) {
    return res.status(404).json({
      error:
        "Assignment not found",
    });
  }

  res.json(assignment);
}

/* CREATE ASSIGNMENT */
export async function createAssignment(
  req: AuthRequest,
  res: Response
) {
  const body =
    createAssignmentSchema.parse(
      req.body
    );

  const totalQuestions =
    body.questionTypes.reduce(
      (s, q) => s + q.count,
      0
    );

  const totalMarks =
    body.questionTypes.reduce(
      (s, q) =>
        s +
        q.count *
          q.marksPerQuestion,
      0
    );

  const assignment =
    await Assignment.create({
      title:
        body.title ??
        "Quiz Assignment",

      dueDate: new Date(
        body.dueDate
      ),

      questionTypes:
        body.questionTypes,

      additionalInstructions:
        body.additionalInstructions,

      uploadedFileText:
        body.uploadedFileText,

      uploadedFileName:
        body.uploadedFileName,

      totalQuestions,

      totalMarks,

      status: "pending",

      progress: 0,

      user: req.userId,
    });

  await enqueueGeneration(
    assignment.id
  );

  res.status(201).json(
    assignment
  );
}

/* DELETE ASSIGNMENT */
export async function deleteAssignment(
  req: AuthRequest,
  res: Response
) {
  const deleted =
    await Assignment.findOneAndDelete(
      {
        _id: req.params.id,
        user: req.userId,
      }
    );

  if (!deleted) {
    return res.status(404).json({
      error:
        "Assignment not found",
    });
  }

  res.status(204).send();
}

/* REGENERATE ASSIGNMENT */
export async function regenerateAssignment(
  req: AuthRequest,
  res: Response
) {
  const assignment =
    await Assignment.findOne({
      _id: req.params.id,
      user: req.userId,
    });

  if (!assignment) {
    return res.status(404).json({
      error:
        "Assignment not found",
    });
  }

  assignment.status =
    "pending";

  assignment.progress = 0;

  assignment.errorMessage =
    undefined;

  assignment.questionPaper =
    undefined;

  await assignment.save();
  await deleteCache(
    `paper:${assignment.id}`
  );

  await enqueueGeneration(
    assignment.id
  );

  res.json(assignment);
}

/* GET QUESTION PAPER */
export async function getQuestionPaper(
  req: AuthRequest,
  res: Response
) {
  const assignment =
    await Assignment.findOne({
      _id: req.params.id,
      user: req.userId,
    });

  if (!assignment) {
    return res.status(404).json({
      error:
        "Assignment not found",
    });
  }

  if (assignment.questionPaper) {
    const parsed =
      questionPaperSchema.safeParse(
        assignment.questionPaper
      );

    if (parsed.success) {
      return res.json({
        status:
          assignment.status,

        progress:
          assignment.progress,

        paper: parsed.data,

        answerKey:
          assignment.answerKey ??
          [],

        totalMarks:
          assignment.totalMarks,

        totalQuestions:
          assignment.totalQuestions,
      });
    }
  }

  const cached =
    await getCached<{
      sections: unknown[];
    }>(
      `paper:${req.params.id}`
    );

  if (cached) {
    const parsed =
      questionPaperSchema.safeParse(
        cached
      );

    if (parsed.success) {
      return res.json({
        status:
          assignment.status,

        progress:
          assignment.progress,

        paper: parsed.data,

        answerKey:
          assignment.answerKey ??
          [],

        totalMarks:
          assignment.totalMarks,

        totalQuestions:
          assignment.totalQuestions,
      });
    }
  }

  res.json({
    status: assignment.status,

    progress:
      assignment.progress,

    paper: null,

    answerKey: [],

    error:
      assignment.errorMessage,
  });
}

/* DOWNLOAD PDF */
export async function downloadPdf(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const assignment =
      await Assignment.findOne({
        _id: req.params.id,
        user: req.userId,
      });

    if (
      !assignment?.questionPaper
    ) {
      return res.status(404).json(
        {
          error:
            "Question paper not ready",
        }
      );
    }

    const user =
      await User.findById(
        req.userId
      );

    const parsed =
      questionPaperSchema.parse(
        assignment.questionPaper
      );

    const buffer =
      await generateQuestionPaperPdf(
        parsed,
        {
          schoolName:
            user?.schoolName ||
            "Your School",

          subject:
            user?.subject ||
            "Subject",

          className:
            user?.className ||
            "Class",

          timeAllowed:
            "60 Minutes",

          maxMarks:
            assignment.totalMarks,
        }
      );

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="question-paper-${assignment.id}.pdf"`
    );

    res.send(buffer);
  } catch (err) {
    next(err);
  }
}