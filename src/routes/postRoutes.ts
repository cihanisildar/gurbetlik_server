import { Router } from 'express';
import * as postController from '../controllers/PostController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { generalLimiter, postLimiter, commentLimiter } from '../middleware/rateLimiter';
import { postImagesUpload } from '../middleware/upload';


const router = Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management, likes, and comments
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: string
 *         description: Filter posts by city ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ['REVIEW', 'GUIDE', 'EXPERIENCE', 'QUESTION', 'DISCUSSION', 'TIP']
 *         description: Filter posts by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search posts by title or content
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Posts retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/', generalLimiter, optionalAuth, postController.getPosts);

// Countries list used in posts
router.get('/countries', generalLimiter, postController.getCountriesStats);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Post retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', generalLimiter, optionalAuth, postController.getPostById);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, tags, countryCode]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Amazing experience in Istanbul"
 *               content:
 *                 type: string
 *                 example: "Just visited Istanbul and had an incredible time exploring the city..."
 *               category:
 *                 type: string
 *                 enum: ['REVIEW', 'GUIDE', 'EXPERIENCE', 'QUESTION', 'DISCUSSION', 'TIP']
 *                 default: 'DISCUSSION'
 *                 example: "EXPERIENCE"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['JOB', 'VISA', 'CULTURE', 'REMOTE', 'STUDY', 'HOUSING', 'LANGUAGE', 'NETWORKING', 'INTERVIEW', 'SALARY']
 *                 maxItems: 5
 *                 example: ["JOB", "CULTURE"]
 *               countryCode:
 *                 type: string
 *                 example: "TR"
 *                 description: Country code (ISO 3166-1 alpha-2, e.g., TR for Turkey, US for United States)
 *               cityId:
 *                 type: string
 *                 nullable: true
 *                 example: "12345"
 *                 description: City ID (must match countryCode)
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, content, tags, cityId]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Amazing experience in Istanbul"
 *               content:
 *                 type: string
 *                 example: "Just visited Istanbul and had an incredible time exploring the city..."
 *               category:
 *                 type: string
 *                 enum: ['REVIEW', 'GUIDE', 'EXPERIENCE', 'QUESTION', 'DISCUSSION', 'TIP']
 *                 default: 'DISCUSSION'
 *                 example: "EXPERIENCE"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['JOB', 'VISA', 'CULTURE', 'REMOTE', 'STUDY', 'HOUSING', 'LANGUAGE', 'NETWORKING', 'INTERVIEW', 'SALARY']
 *                 maxItems: 5
 *                 example: ["JOB", "CULTURE"]
 *               cityId:
 *                 type: string
 *                 example: "12345"
 *                 description: City ID
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *                 description: Optional images to attach to the post
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Post created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Too many posts created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticateToken, postImagesUpload.array('images', 10), postLimiter, postController.createPost);

/**
 * @swagger
 * /api/posts/{id}/upvote:
 *   post:
 *     summary: Upvote a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post upvoted successfully
 */
router.post('/:id/upvote', authenticateToken, generalLimiter, postController.upvotePost);

/**
 * @swagger
 * /api/posts/{id}/downvote:
 *   post:
 *     summary: Downvote a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post downvoted successfully
 */
router.post('/:id/downvote', authenticateToken, generalLimiter, postController.downvotePost);

/**
 * @swagger
 * /api/posts/{id}/vote:
 *   delete:
 *     summary: Remove vote from a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Vote removed successfully
 */
router.delete('/:id/vote', authenticateToken, generalLimiter, postController.removeVote);

/**
 * @swagger
 * /api/posts/{id}/save:
 *   post:
 *     summary: Save a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post saved successfully
 */
router.post('/:id/save', authenticateToken, generalLimiter, postController.savePost);

/**
 * @swagger
 * /api/posts/{id}/save:
 *   delete:
 *     summary: Unsave a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post unsaved successfully
 */
router.delete('/:id/save', authenticateToken, generalLimiter, postController.unsavePost);

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   get:
 *     summary: Get comments for a specific post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Comments retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/comments', generalLimiter, optionalAuth, postController.getPostComments);

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Great post! I had a similar experience."
 *               parentCommentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: "Parent comment ID to reply to a comment"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Comment added successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     content:
 *                       type: string
 *                     authorId:
 *                       type: string
 *                     postId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/comments', authenticateToken, generalLimiter, postController.addComment);

/**
 * @swagger
 * /api/posts/with-comments:
 *   get:
 *     summary: Get all posts with their comments (optimized to avoid N+1 queries)
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: string
 *         description: Filter posts by city ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ['REVIEW', 'GUIDE', 'EXPERIENCE', 'QUESTION', 'DISCUSSION', 'TIP']
 *         description: Filter posts by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search posts by title or content
 *     responses:
 *       200:
 *         description: Posts with comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Posts with comments retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Post'
 *                           - type: object
 *                             properties:
 *                               comments:
 *                                 type: array
 *                                 items:
 *                                   $ref: '#/components/schemas/Comment'
 *                               hasMoreComments:
 *                                 type: boolean
 *                                 description: Whether there are more comments than shown
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/with-comments', generalLimiter, optionalAuth, postController.getPostsWithComments);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated amazing experience in Istanbul"
 *               content:
 *                 type: string
 *                 example: "Updated content about my incredible time exploring the city..."
 *               category:
 *                 type: string
 *                 enum: ['REVIEW', 'GUIDE', 'EXPERIENCE', 'QUESTION', 'DISCUSSION', 'TIP']
 *                 example: "EXPERIENCE"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ['JOB', 'VISA', 'CULTURE', 'REMOTE', 'STUDY', 'HOUSING', 'LANGUAGE', 'NETWORKING', 'INTERVIEW', 'SALARY']
 *                 maxItems: 5
 *                 example: ["JOB", "CULTURE", "HOUSING"]
 *               cityId:
 *                 type: string
 *                 example: "12345"
 *                 description: City ID
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Post updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - You can only edit your own posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Post deleted successfully
 *                 data:
 *                   type: null
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - You can only delete your own posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', authenticateToken, generalLimiter, postController.updatePost);
router.delete('/:id', authenticateToken, generalLimiter, postController.deletePost);

// Upload images for a post
router.post('/:id/images', authenticateToken, postImagesUpload.array('images', 10), generalLimiter, postController.uploadImages);

export default router; 