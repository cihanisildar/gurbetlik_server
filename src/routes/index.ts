import express from 'express';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import cityRoutes from './cityRoutes';
import postRoutes from './postRoutes';
import roomRoutes from './roomRoutes';
import countryRoutes from './countryRoutes';
import commentRoutes from './commentRoutes';
import cityReviewCommentRoutes from './cityReviewCommentRoutes';
import reviewRoutes from './reviewRoutes';

const router = express.Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information and available endpoints
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gurbetci Server API
 *                 version:
 *                   type: string
 *                   example: "2.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: "/health"
 *                     api:
 *                       type: string
 *                       example: "/api"
 *                     auth:
 *                       type: string
 *                       example: "/api/auth"
 *                     users:
 *                       type: string
 *                       example: "/api/users"
 *                     cities:
 *                       type: string
 *                       example: "/api/cities"
 *                     posts:
 *                       type: string
 *                       example: "/api/posts"
 *                     rooms:
 *                       type: string
 *                       example: "/api/rooms"
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [
 *                     "User Authentication (JWT + Google OAuth)",
 *                     "City Reviews & Ratings",
 *                     "Posts & Comments",
 *                     "Real-time Chat Rooms",
 *                     "User Roles (Explorer/Abroader)",
 *                     "WebSocket Support"
 *                   ]
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Gurbetci Server API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      cities: '/api/cities',
      posts: '/api/posts',
      rooms: '/api/rooms'
    },
    features: [
      'User Authentication (JWT + Google OAuth)',
      'City Reviews & Ratings',
      'Posts & Comments',
      'Real-time Chat Rooms',
      'User Roles (Explorer/Abroader)',
      'WebSocket Support'
    ]
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cities', cityRoutes);
router.use('/posts', postRoutes);
router.use('/rooms', roomRoutes);
router.use('/countries', countryRoutes);
router.use('/comments', commentRoutes);
router.use('/city-review-comments', cityReviewCommentRoutes);
router.use('/reviews', reviewRoutes);

export default router; 