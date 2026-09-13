import {
  Request,
  Response,
} from "express";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import { User } from "../models/User";

import { env } from "../config/env";
import { AuthRequest } from "../middleware/authMiddleware";

/* SIGNUP */
export async function signup(
  req: Request,
  res: Response
) {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const user =
      await User.create({
        name,
        email,
        password:
          hashedPassword,
      });

    const token = jwt.sign(
      {
        userId: user._id,
      },
      env.JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );

    res.status(201).json({
      token,

      user: {
        _id: user._id,

        name: user.name,

        email: user.email,

        avatar:
          user.avatar || "",

        schoolName:
          user.schoolName || "",

        subject:
          user.subject || "",

        className:
          user.className || "",
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Signup failed",
    });
  }
}

/* LOGIN */
export async function login(
  req: Request,
  res: Response
) {
  try {
    const {
      email,
      password,
    } = req.body;

    const user =
      await User.findOne({
        email,
      });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid credentials",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        message:
          "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      env.JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );

    res.json({
      token,

      user: {
        _id: user._id,

        name: user.name,

        email: user.email,

        avatar:
          user.avatar || "",

        schoolName:
          user.schoolName || "",

        subject:
          user.subject || "",

        className:
          user.className || "",
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Login failed",
    });
  }
}

/* REFRESH TOKEN */
export async function refreshToken(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      env.JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        schoolName: user.schoolName || "",
        subject: user.subject || "",
        className: user.className || "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Token refresh failed",
    });
  }
}