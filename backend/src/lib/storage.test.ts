import { describe, expect, test, mock, beforeEach } from 'bun:test';

const s3State = {
  sendCalls: [] as { params: { Bucket: string; Key: string } }[],
  reset() {
    this.sendCalls = [];
  },
};

mock.module('@aws-sdk/client-s3', () => {
  return {
    S3Client: class {
      send(command: unknown) {
        s3State.sendCalls.push(command as { params: { Bucket: string; Key: string } });
        return Promise.resolve({});
      }
    },
    PutObjectCommand: class {
      constructor(public params: { Bucket: string; Key: string; ContentType?: string }) {}
    },
    DeleteObjectCommand: class {
      constructor(public params: { Bucket: string; Key: string }) {}
    },
  };
});

mock.module('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: (
      _client: unknown,
      command: { params: { Bucket: string; Key: string } },
      options: { expiresIn: number },
    ) => {
      const bucket = command.params.Bucket;
      const key = command.params.Key;
      return Promise.resolve(`https://r2-mock.com/${bucket}/${key}?expires=${options.expiresIn}`);
    },
  };
});

import { StorageService } from './storage';
import { ValidationError } from './errors';

describe('StorageService', () => {
  beforeEach(() => {
    s3State.reset();
  });

  describe('generatePresignedUpload', () => {
    test('successfully generates presigned upload parameters', async () => {
      const result = await StorageService.generatePresignedUpload('users/avatars', 'image/png');
      expect(result.uploadUrl).toContain('https://r2-mock.com/seapedia/users/avatars/');
      expect(result.uploadUrl).toContain('.png?expires=300');
      expect(result.objectKey).toMatch(/^users\/avatars\/[a-f0-9-]+\.png$/);
      expect(result.publicUrl).toBe(`https://object-seapedia.sayyidrafee.com/${result.objectKey}`);
    });

    test('throws ValidationError for invalid mime types', async () => {
      await expect(
        StorageService.generatePresignedUpload('users/avatars', 'application/pdf'),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteObject', () => {
    test('sends DeleteObjectCommand to client', async () => {
      await StorageService.deleteObject('users/avatars/test.png');
      expect(s3State.sendCalls.length).toBe(1);
      expect(s3State.sendCalls[0].params.Key).toBe('users/avatars/test.png');
      expect(s3State.sendCalls[0].params.Bucket).toBe('seapedia');
    });

    test('ignores empty or null keys', async () => {
      await StorageService.deleteObject('');
      expect(s3State.sendCalls.length).toBe(0);
    });
  });

  describe('getPublicUrl', () => {
    test('constructs correct public URL', () => {
      const url = StorageService.getPublicUrl('products/images/img.webp');
      expect(url).toBe('https://object-seapedia.sayyidrafee.com/products/images/img.webp');
    });
  });
});
