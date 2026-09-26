import { Router, Request, Response } from 'express';
import { PostRepository, ActivityLogRepository } from '../data/repository.js';
import { requireAdminAuth } from '../auth/auth.middleware.js';

export const blogRouter = Router();

// Ensure all blog CMS routes require authentication
blogRouter.use(requireAdminAuth);

const postRepo = new PostRepository();
const activityRepo = new ActivityLogRepository();

/**
 * GET /api/admin/blog/posts
 * Retrieves all posts, with optional search and status filters.
 */
blogRouter.get('/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const search = (req.query.search as string)?.toLowerCase().trim();

    let posts = await postRepo.getAll();

    if (status && ['published', 'draft', 'scheduled'].includes(status)) {
      posts = posts.filter((p) => p.status === status);
    }

    if (search) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.slug.toLowerCase().includes(search) ||
          p.excerpt.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search),
      );
    }

    res.json(posts);
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

/**
 * GET /api/admin/blog/posts/:slug
 * Retrieves full details and HTML content of a single post.
 */
blogRouter.get('/posts/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    const post = await postRepo.getBySlug(slug);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (err) {
    console.error('Error fetching blog post:', err);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

/**
 * POST /api/admin/blog/posts
 * Creates or updates a blog post.
 */
blogRouter.post('/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const postData = req.body;
    if (!postData || !postData.title?.trim()) {
      res.status(400).json({ error: 'Post title is required' });
      return;
    }

    const isUpdate = Boolean(postData.slug && (await postRepo.getBySlug(postData.slug)));
    const saved = await postRepo.savePost(postData);

    const action = isUpdate ? 'POST_EDITED' : 'POST_CREATED';
    await activityRepo.log(
      action,
      `${isUpdate ? 'Updated' : 'Created'} article "${saved.title}" (Status: ${saved.status})`,
    );

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: `Post ${isUpdate ? 'updated' : 'created'} successfully`,
      post: saved,
    });
  } catch (err: any) {
    if (err.statusCode === 409 || err.code === 'REVISION_CONFLICT') {
      res.status(409).json({
        error: err.message || 'Post was modified by another administrator. Please refresh and reapply your changes.',
        code: 'REVISION_CONFLICT',
      });
      return;
    }
    console.error('Error saving blog post:', err);
    res.status(500).json({ error: err.message || 'Failed to save blog post' });
  }
});

/**
 * POST /api/admin/blog/posts/:slug/publish
 * Publishes a draft or scheduled post immediately.
 */
blogRouter.post('/posts/:slug/publish', async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    const post = await postRepo.getBySlug(slug);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    post.status = 'published';
    post.date = new Date().toISOString().split('T')[0];
    delete post.publishAt;

    const published = await postRepo.savePost(post);
    await activityRepo.log('POST_PUBLISHED', `Published article "${published.title}"`);

    res.json({
      success: true,
      message: 'Post published to public website',
      post: published,
    });
  } catch (err: any) {
    console.error('Error publishing blog post:', err);
    res.status(500).json({ error: err.message || 'Failed to publish blog post' });
  }
});

/**
 * POST /api/admin/blog/posts/:slug/unpublish
 * Unpublishes a post (moves to draft status, removes from public feed and unlinks static file).
 */
blogRouter.post('/posts/:slug/unpublish', async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    const post = await postRepo.getBySlug(slug);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    post.status = 'draft';
    const updated = await postRepo.savePost(post);
    await activityRepo.log('POST_UNPUBLISHED', `Unpublished article "${updated.title}" to draft`);

    res.json({
      success: true,
      message: 'Post unpublished and moved to drafts',
      post: updated,
    });
  } catch (err: any) {
    console.error('Error unpublishing blog post:', err);
    res.status(500).json({ error: err.message || 'Failed to unpublish blog post' });
  }
});

/**
 * DELETE /api/admin/blog/posts/:slug
 * Permanently deletes a post and cleans up its public static asset.
 */
blogRouter.delete('/posts/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    const post = await postRepo.getBySlug(slug);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const success = await postRepo.deletePost(slug);
    if (!success) {
      res.status(500).json({ error: 'Failed to delete post' });
      return;
    }

    await activityRepo.log('POST_DELETED', `Deleted article "${post.title}" (${post.slug})`);

    res.json({
      success: true,
      message: `Article "${post.title}" deleted successfully`,
    });
  } catch (err: any) {
    console.error('Error deleting blog post:', err);
    res.status(500).json({ error: err.message || 'Failed to delete blog post' });
  }
});
