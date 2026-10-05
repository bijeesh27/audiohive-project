import { PutObjectCommand } from "@aws-sdk/client-s3";
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
}

export const s3Service = new S3Service();