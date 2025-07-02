import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import { UserQuery, UpdateUserDto } from '../types';

// Define reusable select objects to reduce duplication
const USER_SELECT_PUBLIC = {
  id: true,
  username: true,
  email: true,
  role: true,
  currentCity: true,
  currentCountry: true,
  targetCountry: true,
  techStack: true,
  bio: true,
  avatar: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
  updatedAt: true,
} as const;

const USER_SELECT_WITH_PASSWORD = {
  ...USER_SELECT_PUBLIC,
  password: true,
} as const;

const USER_SELECT_WITH_COUNTS = {
  ...USER_SELECT_PUBLIC,
  _count: {
    select: {
      posts: true,
      cityReviews: true,
      comments: true,
    },
  },
} as const;

// Type for user creation input - matches Prisma schema exactly
interface CreateUserData {
  username: string;
  email: string;
  password?: string;
  googleId?: string;
  role?: UserRole;
  currentCity?: string;
  currentCountry?: string;
  targetCountry?: string;
  techStack?: string; // JSON string, not array (as per schema)
  bio?: string;
  avatar?: string;
}

export const findAll = async (prisma: PrismaClient, query: UserQuery) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  const skip = (page - 1) * limit;

  // Build where clause with proper typing
  const where: Prisma.UserWhereInput = {};

  if (query.search) {
    const searchTerm = query.search.trim();
    if (searchTerm) {
      where.OR = [
        { username: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { currentCity: { contains: searchTerm, mode: 'insensitive' } },
        { currentCountry: { contains: searchTerm, mode: 'insensitive' } },
        { targetCountry: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
  }

  if (query.role) {
    // Map query roles to Prisma UserRole enum values
    if (query.role === 'EXPLORER') {
      where.role = UserRole.EXPLORER;
    } else if (query.role === 'EMIGRANT' || query.role === 'LOCAL') {
      where.role = UserRole.ABROADER; // Map both to ABROADER
    }
  }

  if (query.currentCountry) {
    where.currentCountry = { contains: query.currentCountry, mode: 'insensitive' };
  }

  if (query.targetCountry) {
    where.targetCountry = { contains: query.targetCountry, mode: 'insensitive' };
  }

  if (query.isOnline !== undefined) {
    where.isOnline = Boolean(query.isOnline);
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SELECT_PUBLIC,
        orderBy: [
          { isOnline: 'desc' },
          { lastSeen: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

export const findAllWithActivity = async (prisma: PrismaClient, query: UserQuery) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(Math.max(1, query.limit || 20), 100);
  const skip = (page - 1) * limit;

  // Build where clause with proper typing
  const where: Prisma.UserWhereInput = {};

  if (query.search) {
    const searchTerm = query.search.trim();
    if (searchTerm) {
      where.OR = [
        { username: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { currentCity: { contains: searchTerm, mode: 'insensitive' } },
        { currentCountry: { contains: searchTerm, mode: 'insensitive' } },
        { targetCountry: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
  }

  if (query.role) {
    if (query.role === 'EXPLORER') {
      where.role = UserRole.EXPLORER;
    } else if (query.role === 'EMIGRANT' || query.role === 'LOCAL') {
      where.role = UserRole.ABROADER;
    }
  }

  if (query.currentCountry) {
    where.currentCountry = { contains: query.currentCountry, mode: 'insensitive' };
  }

  if (query.targetCountry) {
    where.targetCountry = { contains: query.targetCountry, mode: 'insensitive' };
  }

  if (query.isOnline !== undefined) {
    where.isOnline = Boolean(query.isOnline);
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...USER_SELECT_PUBLIC,
          // Include recent activity to avoid N+1 queries
          posts: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              createdAt: true,
              commentsCount: true
            }
          },
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              createdAt: true,
              post: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          cityReviews: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              createdAt: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  country: true
                }
              }
            }
          },
                          _count: {
          select: {
            posts: true,
            comments: true,
            cityReviews: true,
            roomMemberships: true
          }
        }
        },
        orderBy: [
          { isOnline: 'desc' },
          { lastSeen: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Transform users to include activity flags
    const transformedUsers = users.map(user => ({
      ...user,
      hasMorePosts: user._count.posts > user.posts.length,
      hasMoreComments: user._count.comments > user.comments.length,
      hasMoreReviews: user._count.cityReviews > user.cityReviews.length,
      totalActivity: user._count.posts + user._count.comments + user._count.cityReviews
    }));

    return {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching users with activity:', error);
    throw new Error('Failed to fetch users with activity');
  }
};

export const findById = async (prisma: PrismaClient, id: string) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid user ID');
  }

  try {
    return await prisma.user.findUnique({
      where: { id },
      select: USER_SELECT_WITH_COUNTS
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error('Failed to fetch user');
  }
};

export const findByEmail = async (prisma: PrismaClient, email: string) => {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  try {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: USER_SELECT_WITH_PASSWORD
    });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw new Error('Failed to fetch user');
  }
};

export const findByGoogleId = async (prisma: PrismaClient, googleId: string) => {
  // Google authentication not supported in current schema
  return null;
};

export const create = async (prisma: PrismaClient, userData: CreateUserData) => {
  if (!userData.email || !userData.username) {
    throw new Error('Email and username are required');
  }
  if (!userData.password) {
    throw new Error('Password is required');
  }

  try {
    const data: Prisma.UserCreateInput = {
      username: userData.username,
      email: userData.email.toLowerCase(),
      password: userData.password,
      ...(userData.role && { role: userData.role }),
      ...(userData.currentCity && { currentCity: userData.currentCity }),
      ...(userData.currentCountry && { currentCountry: userData.currentCountry }),
      ...(userData.targetCountry && { targetCountry: userData.targetCountry }),
      techStack: userData.techStack ? JSON.parse(userData.techStack) : [],
      ...(userData.bio && { bio: userData.bio }),
      ...(userData.avatar && { avatar: userData.avatar }),
      isOnline: true,
      lastSeen: new Date()
    };

    return await prisma.user.create({
      data,
      select: USER_SELECT_PUBLIC
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('User with this email or username already exists');
      }
    }
    throw new Error('Failed to create user');
  }
};

export const update = async (prisma: PrismaClient, id: string, updateData: UpdateUserDto) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid user ID');
  }

  // Build update data with proper type checking
  const data: Prisma.UserUpdateInput = {};
  
  if (updateData.username !== undefined) {
    if (!updateData.username.trim()) {
      throw new Error('Username cannot be empty');
    }
    data.username = updateData.username.trim();
  }
  
  if (updateData.currentCity !== undefined) data.currentCity = updateData.currentCity;
  if (updateData.currentCountry !== undefined) data.currentCountry = updateData.currentCountry;
  if (updateData.targetCountry !== undefined) data.targetCountry = updateData.targetCountry;
  if (updateData.techStack !== undefined) {
    // Handle techStack as array (per schema)
    data.techStack = Array.isArray(updateData.techStack) 
      ? updateData.techStack
      : JSON.parse(updateData.techStack);
  }
  if (updateData.bio !== undefined) data.bio = updateData.bio;
  if (updateData.avatar !== undefined) data.avatar = updateData.avatar;

  // Always update the updatedAt field
  data.updatedAt = new Date();

  try {
    return await prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT_PUBLIC
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Username already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('User not found');
      }
    }
    throw new Error('Failed to update user');
  }
};

export const updateOnlineStatus = async (prisma: PrismaClient, id: string, isOnline: boolean) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid user ID');
  }

  try {
    return await prisma.user.update({
      where: { id },
      data: {
        isOnline,
        lastSeen: new Date()
      },
      select: { id: true, isOnline: true, lastSeen: true }
    });
  } catch (error) {
    console.error('Error updating online status:', error);
    throw new Error('Failed to update online status');
  }
};

export const linkGoogleAccount = async (
  prisma: PrismaClient, 
  id: string, 
  googleId: string, 
  avatar?: string
) => {
  // Google authentication not supported in current schema
  throw new Error('Google authentication not supported');
}; 