export interface CreateUserDto {
  username: string;
  email: string;
  password?: string;
  role: 'EXPLORER' | 'ABROADER';
  currentCity?: string;
  currentCountry?: string;
  targetCountry?: string;
  techStack?: string;
  bio?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  currentCity?: string | null;
  currentCountry?: string | null;
  targetCountry?: string | null;
  techStack?: string | null;
  bio?: string | null;
  avatar?: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
} 