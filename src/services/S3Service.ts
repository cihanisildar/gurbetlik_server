import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { awsConfig } from '../config/aws';

const s3 = new S3Client({ 
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  }
});

export const uploadAvatar = async (
  buffer: Buffer,
  mimeType: string,
  userId: string
): Promise<string> => {
  if (!awsConfig.bucketName) {
    throw new Error('S3 bucket name is not configured');
  }

  if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    throw new Error('AWS credentials are not configured');
  }

  const key = `avatars/${userId}/${uuidv4()}`;

  const command = new PutObjectCommand({
    Bucket: awsConfig.bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
    // Removed ACL - will use bucket policy for public access instead
  });

  await s3.send(command);

  // Return the S3 URL - this assumes bucket policy allows public read
  return `https://${awsConfig.bucketName}.s3.${awsConfig.region}.amazonaws.com/${key}`;
};

export const deleteAvatar = async (avatarUrl: string): Promise<void> => {
  if (!awsConfig.bucketName) {
    throw new Error('S3 bucket name is not configured');
  }

  if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    throw new Error('AWS credentials are not configured');
  }

  // Extract the S3 key from the URL
  const key = extractS3KeyFromUrl(avatarUrl);
  if (!key) {
    throw new Error('Invalid avatar URL format');
  }

  const command = new DeleteObjectCommand({
    Bucket: awsConfig.bucketName,
    Key: key,
  });

  await s3.send(command);
};

// Upload image(s) for a post
export const uploadPostImage = async (
  buffer: Buffer,
  mimeType: string,
  postId: string
): Promise<string> => {
  if (!awsConfig.bucketName) {
    throw new Error('S3 bucket name is not configured');
  }

  if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    throw new Error('AWS credentials are not configured');
  }

  const key = `posts/${postId}/${uuidv4()}`;

  const command = new PutObjectCommand({
    Bucket: awsConfig.bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
  });

  await s3.send(command);

  return `https://${awsConfig.bucketName}.s3.${awsConfig.region}.amazonaws.com/${key}`;
};

// Delete an image belonging to a post from S3
export const deletePostImage = async (imageUrl: string): Promise<void> => {
  if (!awsConfig.bucketName) {
    throw new Error('S3 bucket name is not configured');
  }

  if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    throw new Error('AWS credentials are not configured');
  }

  const key = extractS3KeyFromUrl(imageUrl);
  if (!key) {
    throw new Error('Invalid image URL format');
  }

  const command = new DeleteObjectCommand({
    Bucket: awsConfig.bucketName,
    Key: key,
  });

  await s3.send(command);
};

// Helper function to extract S3 key from URL
const extractS3KeyFromUrl = (url: string): string | null => {
  try {
    // Expected format: https://bucket-name.s3.region.amazonaws.com/avatars/userId/filename
    const urlObj = new URL(url);
    
    // Check if it's an S3 URL
    if (!urlObj.hostname.includes('.s3.') || !urlObj.hostname.includes('.amazonaws.com')) {
      return null;
    }
    
    // Extract the key (everything after the domain)
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
}; 