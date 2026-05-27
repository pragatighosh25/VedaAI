import { Router } from "express";

import {
  signup,
  login,
} from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/signup", signup);

authRouter.post("/login", login);