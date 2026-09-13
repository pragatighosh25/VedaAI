import { Router } from "express";

import {
  signup,
  login,
  refreshToken,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

export const authRouter = Router();

authRouter.post("/signup", signup);

authRouter.post("/login", login);

authRouter.post("/refresh", authMiddleware, refreshToken);