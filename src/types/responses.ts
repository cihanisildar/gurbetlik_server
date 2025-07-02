// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export interface PaginatedApiResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// City and Review response types
export interface CityReviewResponse {
  id: string;
  userId: string;
  cityId: string;
  title?: string | null;
  jobOpportunities: number;
  costOfLiving: number;
  safety: number;
  transport: number;
  community: number;
  healthcare?: number | null;
  education?: number | null;
  nightlife?: number | null;
  weather?: number | null;
  internet?: number | null;
  pros?: string[];
  cons?: string[];
  note?: string | null;
  images?: string[];
  likes?: number;
  upvotes: number;
  downvotes: number;
  language?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    avatar?: string;
    role: string;
  };
  city: {
    id: string;
    name: string;
    country: string;
    slug: string;
  };
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null; // When user is authenticated
}

export interface CityResponse {
  id: string;
  name: string;
  country: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

// Post response types
export interface PostResponse {
  id: string;
  userId: string;
  countryId: string;
  cityId?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  hashtags: string[];
  location?: string;
  commentsCount: number;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    role: string;
    avatar?: string;
  };
  city?: {
    id: string;
    name: string;
    country: string;
    countryId?: string;
  };
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null; // When user is authenticated
  isSaved?: boolean; // When user is authenticated
}

export interface CommentResponse {
  id: string;
  userId: string;
  postId: string;
  parentCommentId?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote?: 'UPVOTE' | 'DOWNVOTE' | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  replies?: CommentResponse[]; // Nested replies
}

export interface PostVoteResponse {
  id: string;
  userId: string;
  postId: string;
  type: 'UPVOTE' | 'DOWNVOTE';
  createdAt: Date;
}

export interface PostSaveResponse {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

// Room and Chat response types
export interface RoomResponse {
  id: string;
  name: string;
  description?: string;
  type: string;
  country?: string;
  isPublic: boolean;
  maxMembers: number;
  memberCount: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: number;
    username: string;
    avatar?: string;
  };
  isMember?: boolean; // When user is authenticated
  isAdmin?: boolean; // When user is authenticated
}

export interface MessageResponse {
  id: string;
  userId: string;
  roomId: string;
  content: string;
  createdAt: Date;
  user: {
    id: number;
    username: string;
    avatar?: string;
    isOnline: boolean;
  };
}

export interface RoomMemberResponse {
  id: string;
  userId: string;
  roomId: string;
  joinedAt: Date;
  isAdmin: boolean;
}

// Socket types
export interface SocketUser {
  id: number;
  username: string;
  avatar?: string;
  socketId: string;
  roomIds: number[];
}

export interface SocketMessage {
  roomId: number;
  content: string;
  timestamp: Date;
}

export interface SocketRoomData {
  roomIds: string[];
}

export interface SocketTypingData {
  roomId: string;
  isTyping: boolean;
}

// Response utility functions
export const createSuccessResponse = <T>(message: string, data: T): ApiSuccessResponse<T> => ({
  success: true,
  message,
  data
});

export const createErrorResponse = (message: string, error?: string): ApiErrorResponse => ({
  success: false,
  message,
  ...(error && { error })
});

export const createPaginatedResponse = <T>(data: T[], pagination: {
  page: number;
  limit: number;
  total: number;
  pages: number;
}): PaginatedApiResponse<T> => ({
  success: true,
  data,
  pagination
}); 