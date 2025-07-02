import { Router } from 'express';
import * as cityController from '../controllers/CityController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { generalLimiter, reviewLimiter } from '../middleware/rateLimiter';


const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cities
 *   description: City information and reviews
 */

/**
 * @swagger
 * /api/cities:
 *   get:
 *     summary: Get all cities
 *     tags: [Cities]
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
 *         description: Number of cities per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search cities by name
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter cities by country name
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *         description: Filter cities by country code (e.g., US, TR, GB)
 *     responses:
 *       200:
 *         description: Cities retrieved successfully
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
 *                   example: Cities retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     cities:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/City'
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
router.get('/', generalLimiter, cityController.getCities);

/**
 * @swagger
 * /api/cities/with-reviews:
 *   get:
 *     summary: Get all cities with their reviews (optimized to avoid N+1 queries)
 *     tags: [Cities]
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
 *           default: 20
 *         description: Number of cities per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search cities by name
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: countryCode
 *         schema:
 *           type: string
 *         description: Filter by country code (e.g., US, TR, GB)
 *     responses:
 *       200:
 *         description: Cities with reviews retrieved successfully
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
 *                   example: Cities with reviews retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     cities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           country:
 *                             type: string
 *                           reviews:
 *                             type: array
 *                             items:
 *                               type: object
 *                           hasMoreReviews:
 *                             type: boolean
 *                           averageRatings:
 *                             type: object
 *                             nullable: true
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/with-reviews', generalLimiter, cityController.getCitiesWithReviews);

/**
 * @swagger
 * /api/cities/review:
 *   post:
 *     summary: Create a city review
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cityId, cityName, country, jobOpportunities, costOfLiving, safety, transport, community]
 *             properties:
 *               cityId:
 *                 type: string
 *                 example: "city-123"
 *               cityName:
 *                 type: string
 *                 example: "Berlin"
 *               country:
 *                 type: string
 *                 example: "Germany"
 *               title:
 *                 type: string
 *                 example: "Great city for tech jobs"
 *               jobOpportunities:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               costOfLiving:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 3
 *               safety:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               transport:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               community:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               healthcare:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               education:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               nightlife:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 3
 *               weather:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 3
 *               internet:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Diverse culture", "Good salaries"]
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Expensive rent"]
 *               note:
 *                 type: string
 *                 example: "Great place for expats."
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image1.jpg"]
 *               likes:
 *                 type: integer
 *                 example: 0
 *               language:
 *                 type: string
 *                 example: "en"
 *     responses:
 *       201:
 *         description: Review created successfully
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
 *                   example: Review created successfully
 *                 data:
 *                   $ref: '#/components/schemas/CityReviewResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/review', authenticateToken, reviewLimiter, cityController.createReview);

/**
 * @swagger
 * /api/cities/reviews:
 *   get:
 *     summary: Get reviews for a city
 *     tags: [Cities]
 *     parameters:
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the city
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
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: City reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/CityReviewResponse'
 *                   description: List of city reviews. Each review includes a userVote field ("UPVOTE", "DOWNVOTE", or null) indicating the current user's vote.
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/reviews', generalLimiter, cityController.getCityReviews);

/**
 * @swagger
 * /api/cities/review/{reviewId}:
 *   get:
 *     summary: Get a city review by ID
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to fetch
 *     responses:
 *       200:
 *         description: Review fetched successfully
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
 *                   example: Review fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/CityReviewResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/review/:reviewId', generalLimiter, cityController.getReviewById);

/**
 * @swagger
 * /api/cities/review/{reviewId}:
 *   put:
 *     summary: Update a city review
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated review title"
 *               jobOpportunities:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               costOfLiving:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 2
 *               safety:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 3
 *               transport:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               community:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               healthcare:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               education:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               nightlife:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 3
 *               weather:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 3
 *               internet:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Diverse culture", "Good salaries"]
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Expensive rent"]
 *               note:
 *                 type: string
 *                 example: "Updated note."
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image1.jpg"]
 *               likes:
 *                 type: integer
 *                 example: 1
 *               language:
 *                 type: string
 *                 example: "en"
 *     responses:
 *       200:
 *         description: Review updated successfully
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
 *                   example: Review updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/CityReviewResponse'
 *                   description: The city review, including a userVote field ("UPVOTE", "DOWNVOTE", or null) indicating the current user's vote.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/review/:reviewId', authenticateToken, generalLimiter, cityController.updateReview);

/**
 * @swagger
 * /api/cities/review/{reviewId}:
 *   delete:
 *     summary: Delete a city review
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the review to delete
 *     responses:
 *       200:
 *         description: Review deleted successfully
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
 *                   example: Review deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/review/:reviewId', authenticateToken, generalLimiter, cityController.deleteReview);

/**
 * @swagger
 * /api/cities/review/user:
 *   get:
 *     summary: Get the current user's review for a city
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the city
 *     responses:
 *       200:
 *         description: Review fetched successfully
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
 *                   example: Review fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/CityReviewResponse'
 *                   description: The city review, including a userVote field ("UPVOTE", "DOWNVOTE", or null) indicating the current user's vote.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/review/user', authenticateToken, generalLimiter, cityController.getCityReviewByUser);

/**
 * @swagger
 * /api/cities/reviews/all:
 *   get:
 *     summary: Get all reviews for all cities
 *     tags: [Cities]
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
 *           maximum: 100
 *           default: 20
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: All city reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CityReviewResponse'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/reviews/all', authenticateToken,generalLimiter, cityController.getAllCityReviews);

/**
 * @swagger
 * /api/cities/review/upvote:
 *   post:
 *     summary: Upvote a city review
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cityReviewId]
 *             properties:
 *               cityReviewId:
 *                 type: string
 *                 example: "review-123"
 *     responses:
 *       200:
 *         description: City review upvoted successfully
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
 *                   example: City review upvoted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/review/upvote', authenticateToken, generalLimiter, cityController.upvoteCityReview);

/**
 * @swagger
 * /api/cities/review/downvote:
 *   post:
 *     summary: Downvote a city review
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cityReviewId]
 *             properties:
 *               cityReviewId:
 *                 type: string
 *                 example: "review-123"
 *     responses:
 *       200:
 *         description: City review downvoted successfully
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
 *                   example: City review downvoted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/review/downvote', authenticateToken, generalLimiter, cityController.downvoteCityReview);

/**
 * @swagger
 * /api/cities/review/vote:
 *   delete:
 *     summary: Remove vote from a city review
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cityReviewId]
 *             properties:
 *               cityReviewId:
 *                 type: string
 *                 example: "review-123"
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/review/vote', authenticateToken, generalLimiter, cityController.removeVoteFromCityReview);

/**
 * @swagger
 * /api/cities/review/save:
 *   post:
 *     summary: Save a city review
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cityReviewId]
 *             properties:
 *               cityReviewId:
 *                 type: string
 *                 example: "review-123"
 *     responses:
 *       200:
 *         description: City review saved successfully
 */
router.post('/review/save', authenticateToken, generalLimiter, cityController.saveCityReview);

/**
 * @swagger
 * /api/cities/review/save:
 *   delete:
 *     summary: Unsave a city review
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cityReviewId]
 *             properties:
 *               cityReviewId:
 *                 type: string
 *                 example: "review-123"
 *     responses:
 *       200:
 *         description: City review unsaved successfully
 */
router.delete('/review/save', authenticateToken, generalLimiter, cityController.unsaveCityReview);

/**
 * @swagger
 * /api/cities/review/{id}/comments:
 *   get:
 *     summary: Get comments for a specific city review
 *     tags: [Cities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City review ID
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
 *                         $ref: '#/components/schemas/CityReviewComment'
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
router.get('/review/:id/comments', generalLimiter, optionalAuth, cityController.getCityReviewComments);

/**
 * @swagger
 * /api/cities/review/{id}/comments:
 *   post:
 *     summary: Add a comment to a city review
 *     tags: [Cities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: City review ID
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
 *                 example: "Great review! I had a similar experience in this city."
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
 *                     userId:
 *                       type: string
 *                     cityReviewId:
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
router.post('/review/:id/comments', authenticateToken, generalLimiter, cityController.addCityReviewComment);

// New RESTful routes for city reviews ---------------------------------
router.post('/:cityId/reviews', authenticateToken, reviewLimiter, cityController.createReview);
router.get('/:cityId/reviews', generalLimiter, cityController.getCityReviews);
router.get('/:cityId/review/user', authenticateToken, generalLimiter, cityController.getCityReviewByUser);
// ----------------------------------------------------------------------

export default router; 