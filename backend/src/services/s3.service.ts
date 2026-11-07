import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3.js";

interface IUploadToS3 {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export class S3Service {
  async uploadFile(data: IUploadToS3): Promise<string> {
    const key = `documents/${Date.now()}-${data.fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: data.buffer,
      ContentType: data.mimeType,
    });

    await s3Client.send(command);

    return key;
  }

  async downloadFile(key: string): Promise<Buffer> {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error("The stored document has no file content");
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  /**
   * Generates a temporary Presigned URL for viewing or downloading a file directly from S3.
   * @param key S3 object key
   * @param originalName Display name for Content-Disposition header
   * @param mimeType MIME type for Content-Type header
   * @param expiresInSeconds Expiry time in seconds (default: 15 minutes)
   */
  async getPresignedDownloadUrl(
    key: string,
    originalName: string,
    mimeType: string,
    expiresInSeconds = 900
  ): Promise<string> {
    const encodedFileName = encodeURIComponent(originalName);
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ResponseContentType: mimeType,
      ResponseContentDisposition: `inline; filename*=UTF-8''${encodedFileName}`,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Generates a temporary Presigned URL for uploading a file directly to S3.
   * @param key S3 object key
   * @param mimeType MIME type for Content-Type header
   * @param expiresInSeconds Expiry time in seconds (default: 5 minutes)
   */
  async getPresignedUploadUrl(
    key: string,
    mimeType: string,
    expiresInSeconds = 300
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }
}

export const s3Service = new S3Service();
