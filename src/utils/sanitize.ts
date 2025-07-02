/**
 * Sanitize HTML content to prevent XSS attacks
 * Basic implementation without external dependencies
 */
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags and script content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Sanitize text input for database storage
 */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 10000); // Limit length
};

/**
 * Sanitize username input
 */
export const sanitizeUsername = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, '') // Only allow alphanumeric, underscore, dot, dash
    .substring(0, 50); // Limit length
};

/**
 * Sanitize search query input
 */
export const sanitizeSearchQuery = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit search query length
};

/**
 * Validate and sanitize URL input
 */
export const sanitizeUrl = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  try {
    const url = new URL(input);
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch (error) {
    return '';
  }
};

/**
 * Sanitize array of strings
 */
export const sanitizeStringArray = (input: string[]): string[] => {
  if (!Array.isArray(input)) return [];
  
  return input
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitizeText(item))
    .slice(0, 20); // Limit array size
}; 