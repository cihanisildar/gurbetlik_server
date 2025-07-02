import { Request, Response } from 'express';
import { prisma } from '../index';
import * as authService from '../services/AuthService';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  RegisterSchema, 
  LoginSchema, 
  UpdateProfileSchema,
  validateRequest 
} from '../types';
import * as s3Service from '../services/S3Service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateRequest(RegisterSchema, req.body);
    if (!validation.success) {
      res.status(400).json(createErrorResponse('Validation failed', validation.error));
      return;
    }

    const result = await authService.register(prisma, validation.data);

    // Set secure HTTP-only cookies
    res.cookie('gb_accessToken', result.accessToken, {
      httpOnly: true,
      secure: true, // Always require HTTPS for security
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      domain: process.env.COOKIE_DOMAIN // Allow setting cookie domain for production
    });

    res.cookie('gb_refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true, // Always require HTTPS for security
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });

    // Remove the insecure client-side accessible token cookie
    // Client should use the secure httpOnly cookies instead

    res.status(201).json(createSuccessResponse('User registered successfully', {
      user: result.user
    }));
  } catch (error) {
    res.status(400).json(createErrorResponse('Registration failed', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = validateRequest(LoginSchema, req.body);
    if (!validation.success) {
      res.status(400).json(createErrorResponse('Validation failed', validation.error));
      return;
    }

    const result = await authService.login(prisma, validation.data);

    // Set secure HTTP-only cookies
    res.cookie('gb_accessToken', result.accessToken, {
      httpOnly: true,
      secure: true, // Always require HTTPS for security
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });

    res.cookie('gb_refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true, // Always require HTTPS for security
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });

    res.json(createSuccessResponse('Login successful', {
      user: result.user
    }));
  } catch (error) {
    res.status(401).json(createErrorResponse('Login failed', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.gb_refreshToken;

    if (!refreshToken) {
      res.status(401).json(createErrorResponse('Refresh token required'));
      return;
    }

    const result = await authService.refreshAccessToken(prisma, refreshToken);

    // Set new secure HTTP-only cookies
    res.cookie('gb_accessToken', result.accessToken, {
      httpOnly: true,
      secure: true, // Always require HTTPS for security
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });

    res.cookie('gb_refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true, // Always require HTTPS for security
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });

    res.json(createSuccessResponse('Tokens refreshed successfully', null));
  } catch (error) {
    // Clear invalid refresh token with secure settings
    res.clearCookie('gb_refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });
    res.clearCookie('gb_accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });
    
    res.status(401).json(createErrorResponse('Invalid refresh token', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await authService.logout(prisma, userId);

    // Clear authentication cookies with same security settings
    res.clearCookie('gb_accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });

    res.clearCookie('gb_refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    });

    res.json(createSuccessResponse('Logout successful', null));
  } catch (error) {
    res.status(500).json(createErrorResponse('Logout failed', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authService.getProfile(prisma, req.user!.id);

    res.json(createSuccessResponse('Profile retrieved successfully', user));
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json(createErrorResponse('User not found'));
      return;
    }
    res.status(500).json(createErrorResponse('Failed to get profile', error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const validation = validateRequest(UpdateProfileSchema, req.body);
    if (!validation.success) {
      res.status(400).json(createErrorResponse('Validation failed', validation.error));
      return;
    }

    // Prepare update data from validated body
    const updateData: any = { ...validation.data };

    // Get current user data to access old avatar URL
    let oldAvatarUrl: string | null = null;
    if (req.file) {
      const currentUser = await authService.getProfile(prisma, userId);
      oldAvatarUrl = currentUser.avatar ?? null;

      // Upload new avatar to S3
      const avatarUrl = await s3Service.uploadAvatar(
        req.file.buffer,
        req.file.mimetype,
        userId,
      );
      updateData.avatar = avatarUrl;
    }

    // Update user profile
    const user = await authService.updateProfile(prisma, userId, updateData);

    // Delete old avatar after successful update (if it exists and is an S3 URL)
    if (req.file && oldAvatarUrl && oldAvatarUrl.includes('s3.') && oldAvatarUrl.includes('amazonaws.com')) {
      try {
        await s3Service.deleteAvatar(oldAvatarUrl);
      } catch (deleteError) {
        // Log the error but don't fail the request - the profile update was successful
        console.error('Failed to delete old avatar:', deleteError);
      }
    }

    res.json(createSuccessResponse('Profile updated successfully', user));
  } catch (error) {
    res.status(400).json(createErrorResponse('Failed to update profile', error instanceof Error ? error.message : 'Unknown error'));
  }
}; 