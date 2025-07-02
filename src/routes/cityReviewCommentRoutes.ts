import { Router } from 'express';
import * as cityReviewCommentController from '../controllers/CityReviewCommentController';
import { authenticateToken } from '../middleware/auth';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: City Review Comments
 *   description: City review comment voting operations
 */

/**
 * @swagger
 * /api/city-review-comments/{id}/upvote:
 *   post:
 *     summary: Upvote a city review comment
 *     tags: [City Review Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City review comment ID
 *     responses:
 *       200:
 *         description: City review comment upvoted successfully
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
 *                   example: City review comment upvoted successfully
 *                 data:
 *                   type: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/upvote', authenticateToken, generalLimiter, cityReviewCommentController.upvoteComment);

/**
 * @swagger
 * /api/city-review-comments/{id}/downvote:
 *   post:
 *     summary: Downvote a city review comment
 *     tags: [City Review Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City review comment ID
 *     responses:
 *       200:
 *         description: City review comment downvoted successfully
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
 *                   example: City review comment downvoted successfully
 *                 data:
 *                   type: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/downvote', authenticateToken, generalLimiter, cityReviewCommentController.downvoteComment);

/**
 * @swagger
 * /api/city-review-comments/{id}/vote:
 *   delete:
 *     summary: Remove vote from a city review comment
 *     tags: [City Review Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City review comment ID
 *     responses:
 *       200:
 *         description: Vote removed successfully
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
 *                   example: Vote removed successfully
 *                 data:
 *                   type: null
 *       400:
 *         description: No vote to remove or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:id/vote', authenticateToken, generalLimiter, cityReviewCommentController.removeVote);

/**
 * @swagger
 * /api/city-review-comments/{id}:
 *   put:
 *     summary: Update a city review comment
 *     tags: [City Review Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City review comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Updated comment content"
 *                 description: The new content for the comment
 *     responses:
 *       200:
 *         description: City review comment updated successfully
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
 *                   example: City review comment updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/CityReviewComment'
 *       400:
 *         description: Validation error or cannot edit deleted comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - You can only edit your own comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete a city review comment
 *     tags: [City Review Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City review comment ID
 *     responses:
 *       200:
 *         description: City review comment deleted successfully
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
 *                   example: City review comment deleted successfully
 *                 data:
 *                   type: null
 *       400:
 *         description: Comment already deleted or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - You can only delete your own comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', authenticateToken, generalLimiter, cityReviewCommentController.updateComment);
router.delete('/:id', authenticateToken, generalLimiter, cityReviewCommentController.deleteComment);

export default router; 