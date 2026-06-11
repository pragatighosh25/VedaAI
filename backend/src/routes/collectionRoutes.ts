import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { Collection } from "../models/Collection";
import { SavedResource } from "../models/SavedResource";

export const collectionRouter = Router();

/**
 * Fetch all collections for the logged-in user
 * GET /api/collections
 */
collectionRouter.get("/", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const collections = await Collection.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    res.json(collections);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a new collection
 * POST /api/collections
 */
collectionRouter.post("/", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Collection name is required" });
    }

    const collection = await Collection.create({
      user: req.userId,
      name: name.trim(),
      description: description || "",
      resources: [],
    });

    res.status(201).json(collection);
  } catch (error) {
    next(error);
  }
});

/**
 * Fetch a single collection, populating its saved resources
 * GET /api/collections/:id
 */
collectionRouter.get("/:id", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const collection = await Collection.findOne({
      _id: req.params.id,
      user: req.userId,
    }).populate("resources");

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    res.json(collection);
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a collection (does NOT delete the resources inside it, only the collection itself)
 * DELETE /api/collections/:id
 */
collectionRouter.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const deleted = await Collection.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Collection not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * Add a saved resource to a collection
 * POST /api/collections/:id/resources
 */
collectionRouter.post("/:id/resources", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { resourceId } = req.body;

    if (!resourceId) {
      return res.status(400).json({ error: "resourceId is required" });
    }

    const collection = await Collection.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    // Verify the resource exists and belongs to the user
    const resourceExists = await SavedResource.exists({
      _id: resourceId,
      user: req.userId,
    });

    if (!resourceExists) {
      return res.status(404).json({ error: "Saved resource not found" });
    }

    // Check if already in collection
    const alreadyExists = collection.resources.some(
      (id) => id.toString() === resourceId
    );

    if (!alreadyExists) {
      collection.resources.push(resourceId as any);
      await collection.save();
    }

    res.json(collection);
  } catch (error) {
    next(error);
  }
});

/**
 * Remove a resource from a collection
 * DELETE /api/collections/:id/resources/:resourceId
 */
collectionRouter.delete("/:id/resources/:resourceId", authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id, resourceId } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      user: req.userId,
    });

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    collection.resources = collection.resources.filter(
      (refId) => refId.toString() !== resourceId
    );

    await collection.save();
    res.json(collection);
  } catch (error) {
    next(error);
  }
});
