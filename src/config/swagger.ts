import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Gurbetci Server API',
    version: '2.0.0',
    description: 'A comprehensive API for the Gurbetci platform with user authentication, city reviews, posts, and real-time chat rooms',
    contact: {
      name: 'Gurbetci Team',
      email: 'support@gurbetci.com'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? process.env.SERVER_URL || 'https://api.gurbetci.com'
        : 'http://localhost:5000',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'User ID (UUID)'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          username: {
            type: 'string',
            description: 'Username'
          },
          role: {
            type: 'string',
            enum: ['EXPLORER', 'ABROADER'],
            description: 'User role'
          },
          currentCity: {
            type: 'string',
            nullable: true,
            description: 'Current city'
          },
          currentCountry: {
            type: 'string',
            nullable: true,
            description: 'Current country'
          },
          targetCountry: {
            type: 'string',
            nullable: true,
            description: 'Target country'
          },
          techStack: {
            type: 'string',
            nullable: true,
            description: 'Technology stack (JSON string)'
          },
          bio: {
            type: 'string',
            nullable: true,
            description: 'User biography'
          },
          avatar: {
            type: 'string',
            nullable: true,
            description: 'Profile picture URL'
          },
          isOnline: {
            type: 'boolean',
            description: 'Online status'
          },
          lastSeen: {
            type: 'string',
            format: 'date-time',
            description: 'Last seen timestamp'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation date'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update date'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Login successful'
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        }
      },
      RegisterResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'User registered successfully. Please log in with your credentials.'
          },
          data: {
            type: 'null',
            example: null
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error message'
          },
          error: {
            type: 'string',
            description: 'Detailed error message'
          }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'username', 'password', 'role'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          username: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'johndoe'
          },
          password: {
            type: 'string',
            minLength: 6,
            example: 'password123'
          },
          role: {
            type: 'string',
            enum: ['EXPLORER', 'ABROADER'],
            example: 'EXPLORER'
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            example: 'password123'
          }
        }
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            example: 'johndoe'
          },
          currentCity: {
            type: 'string',
            example: 'Berlin'
          },
          currentCountry: {
            type: 'string',
            example: 'Germany'
          },
          targetCountry: {
            type: 'string',
            example: 'Canada'
          },
          techStack: {
            type: 'string',
            example: 'JavaScript, Node.js, React'
          },
          bio: {
            type: 'string',
            example: 'Travel enthusiast and digital nomad'
          },
          avatar: {
            type: 'string',
            example: 'https://example.com/profile.jpg'
          }
        }
      },
      Post: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Post ID (UUID)'
          },
          title: {
            type: 'string',
            description: 'Post title'
          },
          content: {
            type: 'string',
            description: 'Post content'
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'Author ID (UUID)'
          },
          cityId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'Related city ID (UUID)'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['JOB', 'VISA', 'CULTURE', 'REMOTE', 'STUDY', 'HOUSING', 'LANGUAGE', 'NETWORKING', 'INTERVIEW', 'SALARY']
            },
            description: 'Post tags'
          },
          likesCount: {
            type: 'integer',
            default: 0,
            description: 'Number of likes'
          },
          commentsCount: {
            type: 'integer',
            default: 0,
            description: 'Number of comments'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      City: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'City ID (UUID)'
          },
          name: {
            type: 'string',
            description: 'City name'
          },
          country: {
            type: 'string',
            description: 'Country name'
          },
          slug: {
            type: 'string',
            description: 'City slug (e.g., "berlin-germany")'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation date'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update date'
          }
        }
      },
      Room: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Room ID (UUID)'
          },
          name: {
            type: 'string',
            description: 'Room name'
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Room description'
          },
          type: {
            type: 'string',
            enum: ['COUNTRY', 'STUDY', 'INTERVIEW', 'LANGUAGE', 'GENERAL'],
            default: 'GENERAL',
            description: 'Room type'
          },
          country: {
            type: 'string',
            nullable: true,
            description: 'Country for country-based rooms'
          },
          isPublic: {
            type: 'boolean',
            default: true,
            description: 'Whether the room is public'
          },
          maxMembers: {
            type: 'integer',
            default: 100,
            description: 'Maximum number of members'
          },
          memberCount: {
            type: 'integer',
            default: 0,
            description: 'Current number of members'
          },
          createdById: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the user who created the room (UUID)'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation date'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update date'
          }
        }
      },
      Comment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Comment ID (UUID)'
          },
          parentCommentId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'Parent comment ID when this comment is a reply'
          },
          content: {
            type: 'string',
            description: 'Comment content'
          },
          upvotes: {
            type: 'integer',
            default: 0,
            description: 'Number of upvotes'
          },
          downvotes: {
            type: 'integer',
            default: 0,
            description: 'Number of downvotes'
          },
          score: {
            type: 'integer',
            description: 'Net score (upvotes - downvotes)'
          },
          userVote: {
            type: 'string',
            enum: ['UPVOTE', 'DOWNVOTE'],
            nullable: true,
            description: 'Current user vote on this comment (when authenticated)'
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'Author ID (UUID)'
          },
          postId: {
            type: 'string',
            format: 'uuid',
            description: 'Post ID (UUID)'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          },
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid'
              },
              username: {
                type: 'string'
              },
              avatar: {
                type: 'string',
                nullable: true
              },
              role: {
                type: 'string'
              }
            }
          },
          replies: {
            type: 'array',
            description: 'Nested replies (supports infinite depth)',
            items: {
              $ref: '#/components/schemas/Comment'
            }
          }
        }
      },
      CommentVote: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Comment vote ID (UUID)'
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID who voted (UUID)'
          },
          commentId: {
            type: 'string',
            format: 'uuid',
            description: 'Comment ID that was voted on (UUID)'
          },
          type: {
            type: 'string',
            enum: ['UPVOTE', 'DOWNVOTE'],
            description: 'Type of vote'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the vote was created'
          }
        }
      },
      CityReview: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          cityId: { type: 'string', format: 'uuid' },
          title: { type: 'string', nullable: true },
          jobOpportunities: { type: 'integer', minimum: 1, maximum: 5 },
          costOfLiving: { type: 'integer', minimum: 1, maximum: 5 },
          safety: { type: 'integer', minimum: 1, maximum: 5 },
          transport: { type: 'integer', minimum: 1, maximum: 5 },
          community: { type: 'integer', minimum: 1, maximum: 5 },
          healthcare: { type: 'integer', minimum: 1, maximum: 5 },
          education: { type: 'integer', minimum: 1, maximum: 5 },
          nightlife: { type: 'integer', minimum: 1, maximum: 5 },
          weather: { type: 'integer', minimum: 1, maximum: 5 },
          internet: { type: 'integer', minimum: 1, maximum: 5 },
          pros: { type: 'array', items: { type: 'string' } },
          cons: { type: 'array', items: { type: 'string' } },
          note: { type: 'string', nullable: true },
          images: { type: 'array', items: { type: 'string' } },
          likes: { type: 'integer' },
          commentsCount: { type: 'integer' },
          upvotes: { type: 'integer' },
          downvotes: { type: 'integer' },
          score: { type: 'integer' },
          language: { type: 'string', nullable: true },
          userVote: {
            type: 'string',
            enum: ['UPVOTE', 'DOWNVOTE'],
            nullable: true,
            description: 'Current user vote on this review (when authenticated)'
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          city: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              country: { type: 'string' }
            }
          },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      CityReviewResponse: {
        allOf: [
          { $ref: '#/components/schemas/CityReview' }
        ]
      },
      CityReviewComment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          cityReviewId: { type: 'string', format: 'uuid' },
          parentCommentId: { type: 'string', format: 'uuid', nullable: true },
          content: { type: 'string' },
          upvotes: { type: 'integer' },
          downvotes: { type: 'integer' },
          score: { type: 'integer' },
          userVote: { type: 'string', enum: ['UPVOTE', 'DOWNVOTE'], nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/User' },
          replies: {
            type: 'array',
            description: 'Nested replies (supports infinite depth)',
            items: { $ref: '#/components/schemas/CityReviewComment' }
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJSDoc(options); 