import { Router, Request, Response } from 'express';
import multer from 'multer';
import { MediaRepository, PostRepository, ActivityLogRepository } from '../data/repository.js';
import { requireAdminAuth } from '../auth/auth.middleware.js';

export const mediaRouter = Router();

// Ensure all media vault routes require authentication
mediaRouter.use(requireAdminAuth);

const mediaRepo = new MediaRepository();
const postRepo = new PostRepository();
const activityRepo = new ActivityLogRepository();

// Configure multer with memory storage and 5MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

/**
 * GET /api/admin/media
 * Returns all media items, cross-referenced with posts for in-use status.
 */
mediaRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await mediaRepo.getAll(postRepo);
    res.json(items);
  } catch (err) {
    console.error('Error fetching media items:', err);
    res.status(500).json({ error: 'Failed to fetch media assets' });
  }
});

/**
 * POST /api/admin/media/upload
 * Handles multipart file upload with validation, sanitization, 5MB limit (HTTP 413), and activity logging.
 */
mediaRouter.post(
  '/upload',
  (req: Request, res: Response, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ error: 'File size exceeds the 5MB limit. Please upload an image under 5MB.' });
          return;
        }
        if (err instanceof multer.MulterError) {
          res.status(400).json({ error: `Upload error: ${err.message}` });
          return;
        }
        res.status(400).json({ error: err.message || 'File upload failed' });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file uploaded' });
        return;
      }

      const { originalname, buffer, mimetype } = req.file;

      const mediaItem = await mediaRepo.saveFile(originalname, buffer, mimetype);

      await activityRepo.log(
        'MEDIA_UPLOADED',
        `Uploaded image asset "${mediaItem.filename}" (${Math.round(mediaItem.sizeBytes / 1024)} KB)`,
      );

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        media: mediaItem,
      });
    } catch (err: any) {
      console.error('Error uploading media asset:', err);
      const status = err.statusCode === 413 ? 413 : 400;
      res.status(status).json({ error: err.message || 'Upload processing failed' });
    }
  },
);

/**
 * DELETE /api/admin/media/:filename
 * Safely deletes an uploaded image with path traversal and in-use checks.
 */
mediaRouter.delete('/:filename', async (req: Request, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename;
    const result = await mediaRepo.deleteFile(filename, postRepo);

    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to delete file' });
      return;
    }

    await activityRepo.log('MEDIA_DELETED', `Deleted image asset "${filename}"`);

    res.json({
      success: true,
      message: `Asset "${filename}" deleted successfully`,
    });
  } catch (err: any) {
    console.error('Error deleting media asset:', err);
    res.status(500).json({ error: err.message || 'Failed to delete asset' });
  }
});
