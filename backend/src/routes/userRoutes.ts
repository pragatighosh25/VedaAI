import express from "express";

import {
  getProfile,
  updateProfile,
  updatePassword,
} from "../controllers/userController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

router.put(
  "/profile",
  authMiddleware,
  updateProfile
);

router.put(
  "/change-password",
  authMiddleware,
  updatePassword
);

export const userRouter = router;