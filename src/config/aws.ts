import dotenv from 'dotenv';

dotenv.config();

export const awsConfig = {
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1',
  bucketName: process.env.AWS_S3_BUCKET_NAME || '',
  accessKeyId: process.env.AWS_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
};

// Validate required AWS configuration
if (!awsConfig.bucketName) {
  console.warn('⚠️  WARNING: AWS_S3_BUCKET_NAME is not set. Avatar upload will not work without it.');
}

if (!awsConfig.accessKeyId) {
  console.warn('⚠️  WARNING: AWS access key is not set. Avatar upload will not work without it.');
}

if (!awsConfig.secretAccessKey) {
  console.warn('⚠️  WARNING: AWS secret key is not set. Avatar upload will not work without it.');
} 