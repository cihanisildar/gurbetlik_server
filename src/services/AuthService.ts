import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { RegisterDto, LoginDto, UserResponse } from '../types';
import * as userRepository from '../repositories/UserRepository';
import { jwtSecret, jwtExpiresIn, jwtRefreshSecret, jwtRefreshExpiresIn, bcryptRounds } from '../config/secrets';

const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email, type: 'access' },
    jwtSecret,
    { expiresIn: '15m' } as jwt.SignOptions
  );
};

const generateRefreshToken = (userId: string, email: string): string => {
  if (!jwtRefreshSecret) {
    console.error('[Auth] JWT_REFRESH_SECRET is not configured - refresh tokens will not work');
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.sign(
    { userId, email, type: 'refresh' },
    jwtRefreshSecret,
    { expiresIn: '30d' }
  );
};

export const verifyAccessToken = (token: string): { userId: string; email: string } => {
  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string; type: string };
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    console.error('[Auth] Access token verification failed:', error);
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): { userId: string; email: string } => {
  try {
    if (!jwtRefreshSecret) {
      console.error('[Auth] JWT_REFRESH_SECRET is not configured');
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    const decoded = jwt.verify(token, jwtRefreshSecret) as { userId: string; email: string; type: string };
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    console.error('[Auth] Refresh token verification failed:', error);
    throw new Error('Invalid refresh token');
  }
};

export const register = async (prisma: PrismaClient, userData: RegisterDto): Promise<{ user: UserResponse; accessToken: string; refreshToken: string }> => {
  try {
    console.log(`[Auth] Attempting to register user: ${userData.email}`);
    
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(prisma, userData.email);

    if (existingUser) {
      console.log(`[Auth] Registration failed - user already exists: ${userData.email}`);
      // Use generic error message to prevent user enumeration
      throw new Error('Registration failed. Please check your information and try again.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, bcryptRounds);

    // Create user
    const user = await userRepository.create(prisma, {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role
    });

    console.log(`[Auth] User created successfully: ${user.email}`);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    console.log(`[Auth] Tokens generated successfully for user: ${user.email}`);

    // Transform user data to match UserResponse type
    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      currentCity: user.currentCity,
      currentCountry: user.currentCountry,
      targetCountry: user.targetCountry,
      techStack: Array.isArray(user.techStack) ? JSON.stringify(user.techStack) : null,
      bio: user.bio,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return { user: userResponse, accessToken, refreshToken };
  } catch (error) {
    console.error(`[Auth] Registration failed for ${userData.email}:`, error);
    throw error;
  }
};

export const login = async (prisma: PrismaClient, loginData: LoginDto): Promise<{ user: UserResponse; accessToken: string; refreshToken: string }> => {
  try {
    console.log(`[Auth] Attempting to login user: ${loginData.email}`);
    
    // Find user by email
    const user = await userRepository.findByEmail(prisma, loginData.email);

    if (!user) {
      console.log(`[Auth] Login failed - user not found: ${loginData.email}`);
      throw new Error('Invalid email or password');
    }

    // Check password
    if (!user.password) {
      console.log(`[Auth] Login failed - no password set for user: ${loginData.email}`);
      throw new Error('Please use Google OAuth to login');
    }

    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      console.log(`[Auth] Login failed - invalid password for user: ${loginData.email}`);
      throw new Error('Invalid email or password');
    }

    // Update online status
    await userRepository.updateOnlineStatus(prisma, user.id, true);

    // Remove password from response and transform techStack
    const { password, ...userWithoutPassword } = user;
    const userResponse: UserResponse = {
      ...userWithoutPassword,
      techStack: Array.isArray(userWithoutPassword.techStack) ? JSON.stringify(userWithoutPassword.techStack) : null
    };

    console.log(`[Auth] User authenticated successfully: ${user.email}`);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    console.log(`[Auth] Tokens generated successfully for user: ${user.email}`);

    return { user: userResponse, accessToken, refreshToken };
  } catch (error) {
    console.error(`[Auth] Login failed for ${loginData.email}:`, error);
    throw error;
  }
};

export const googleAuth = async (prisma: PrismaClient, googleProfile: any): Promise<{ user: UserResponse; accessToken: string; refreshToken: string; isNewUser: boolean }> => {
  // Google authentication not supported in current schema
  throw new Error('Google authentication not supported');
};

export const logout = async (prisma: PrismaClient, userId: string): Promise<void> => {
  await userRepository.updateOnlineStatus(prisma, userId, false);
};

export const refreshAccessToken = async (prisma: PrismaClient, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if user still exists
    const user = await userRepository.findById(prisma, decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id, user.email);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const getProfile = async (prisma: PrismaClient, userId: string): Promise<UserResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
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
      updatedAt: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Transform techStack for response
  const userResponse: UserResponse = {
    ...user,
    techStack: Array.isArray(user.techStack) ? JSON.stringify(user.techStack) : null
  };

  return userResponse;
};

export const updateProfile = async (prisma: PrismaClient, userId: string, updateData: any): Promise<UserResponse> => {
  // Define allowed fields that can be updated
  const allowedFields = [
    'username',
    'currentCity',
    'currentCountry', 
    'targetCountry',
    'techStack',
    'bio',
    'avatar'
  ];

  // Filter updateData to only include allowed fields that exist in the schema
  const filteredData: any = {};
  
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  }

  // If no valid fields to update, throw an error
  if (Object.keys(filteredData).length === 0) {
    throw new Error('No valid fields provided for update');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: filteredData,
    select: {
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
      updatedAt: true
    }
  });

  // Transform techStack for response
  const userResponse: UserResponse = {
    ...user,
    techStack: Array.isArray(user.techStack) ? JSON.stringify(user.techStack) : null
  };

  return userResponse;
}; 