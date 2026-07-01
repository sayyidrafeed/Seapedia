import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/env';
import { ValidationError } from './errors';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Lazy initialize S3 Client to avoid parsing errors during testing if process envs aren't present
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME
  ) {
    throw new Error(
      'Missing Cloudflare R2 environment variables. Please check your R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME configurations.',
    );
  }

  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      region: 'auto',
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return s3Client;
}

export class StorageService {
  /**
   * Generates a pre-signed URL for direct upload to Cloudflare R2
   */
  static async generatePresignedUpload(
    prefix: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; objectKey: string; publicUrl: string }> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new ValidationError('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.');
    }

    if (!env.R2_BUCKET_NAME) {
      throw new Error('R2_BUCKET_NAME is not configured.');
    }

    const extension = MIME_TO_EXT[mimeType];
    const uuid = crypto.randomUUID();
    // Normalize prefix to not have trailing/leading slashes
    const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '');
    const objectKey = normalizedPrefix
      ? `${normalizedPrefix}/${uuid}${extension}`
      : `${uuid}${extension}`;

    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: mimeType,
    });

    // Sign the URL with 5 minutes (300 seconds) expiration
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    const publicUrl = this.getPublicUrl(objectKey);

    return {
      uploadUrl,
      objectKey,
      publicUrl,
    };
  }

  /**
   * Deletes an object from Cloudflare R2
   */
  static async deleteObject(objectKey: string): Promise<void> {
    if (!objectKey) return;
    try {
      const client = getS3Client();
      const command = new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: objectKey,
      });

      await client.send(command);
    } catch (error) {
      console.error(`Failed to delete object "${objectKey}" from R2:`, error);
    }
  }

  /**
   * Formats a public URL for a given object key
   */
  static getPublicUrl(objectKey: string): string {
    if (!objectKey) return '';
    const cleanKey = objectKey.replace(/^\/+/g, '');
    const domain = env.R2_PUBLIC_DOMAIN;
    if (!domain) {
      return '';
    }
    const cleanDomain = domain.replace(/\/+$/, '');
    const protocol =
      cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://') ? '' : 'https://';
    return `${protocol}${cleanDomain}/${cleanKey}`;
  }
}
