import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { searchAllResources } from "../services/resourceService";
import { SavedResource } from "../models/SavedResource";
import { getCached, setCache } from "../utils/redis";

export const resourceRouter = Router();

/**
 * Search educational resources by topic
 * GET /api/resources?q=topic&subject=subject
 */
resourceRouter.get("/", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const query = req.query.q as string;
    const subject = req.query.subject as string | undefined;
    const className = req.query.className as string | undefined;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const qStr = query.toLowerCase().trim();
    const subStr = (subject || "").toLowerCase().trim();
    const classStr = (className || "").toLowerCase().trim();
    const cacheKey = `resources:search:q=${qStr}:sub=${subStr}:class=${classStr}`;

    const cached = await getCached<any[]>(cacheKey).catch((err) => {
      console.warn("Failed to read search cache:", err.message);
      return null;
    });

    if (cached) {
      return res.json({
        query,
        subject,
        className,
        resources: cached,
        cached: true,
      });
    }

    const resources = await searchAllResources(query, subject, className);

    await setCache(cacheKey, resources).catch((err) => {
      console.warn("Failed to write search cache:", err.message);
    });

    res.json({
      query,
      subject,
      className,
      resources,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Bookmark/Save an academic resource for the user
 * POST /api/resources/save
 */
resourceRouter.post("/save", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { title, description, url, thumbnail, publisher, type } = req.body;

    if (!title || !url || !type) {
      return res.status(400).json({ error: "title, url, and type are required" });
    }

    // Try to find if already bookmarked to prevent Mongoose duplicate key error
    const existing = await SavedResource.findOne({ user: req.userId, url });
    if (existing) {
      return res.json(existing); // Return existing if already saved
    }

    const saved = await SavedResource.create({
      user: req.userId,
      title,
      description: description || "",
      url,
      thumbnail: thumbnail || "",
      publisher: publisher || "",
      type,
    });

    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
});

/**
 * Fetch all saved resources for the logged-in user
 * GET /api/resources/saved
 */
resourceRouter.get("/saved", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const savedResources = await SavedResource.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    res.json(savedResources);
  } catch (error) {
    next(error);
  }
});

/**
 * Delete/Remove a saved resource
 * DELETE /api/resources/saved/:id
 */
resourceRouter.delete("/saved/:id", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const deleted = await SavedResource.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Saved resource not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
