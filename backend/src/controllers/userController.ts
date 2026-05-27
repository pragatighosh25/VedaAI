import { Response } from "express";

import bcrypt from "bcryptjs";

import { User } from "../models/User";

import { AuthRequest } from "../middleware/authMiddleware";

/* GET PROFILE */
export async function getProfile(
  req: AuthRequest,
  res: Response
) {
  try {
    const user =
      await User.findById(
        req.userId
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to fetch profile",
    });
  }
}

/* UPDATE PROFILE */
export async function updateProfile(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      name,
      avatar,
      schoolName,
      subject,
      className,
    } = req.body;

    const updatedUser =
      await User.findByIdAndUpdate(
        req.userId,

        {
          name,
          avatar,
          schoolName,
          subject,
          className,
        },

        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to update profile",
    });
  }
}

/* UPDATE PASSWORD */
export async function updatePassword(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        error:
          "Both passwords are required",
      });
    }

    const user =
      await User.findById(
        req.userId
      );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const valid =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!valid) {
      return res.status(400).json({
        error:
          "Current password incorrect",
      });
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    await user.save();

    res.json({
      message:
        "Password updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to update password",
    });
  }
}