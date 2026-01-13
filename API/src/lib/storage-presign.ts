import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type PresignInput = {
  bucket: string;
  key: string;
  expiresIn: number;
};

export const resolveS3Client = () => {
  const region = process.env.SPACES_REGION || "us-east-1";
  const endpoint = process.env.SPACES_ENDPOINT;
  const accessKeyId = process.env.SPACES_KEY;
  const secretAccessKey = process.env.SPACES_SECRET;
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }
  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: Boolean(endpoint),
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
};

export const presignStorageObject = async ({ bucket, key, expiresIn }: PresignInput) => {
  const client = resolveS3Client();
  if (!client) {
    throw new Error("S3 credentials not configured");
  }
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
};

type PresignPutInput = {
  bucket: string;
  key: string;
  expiresIn?: number;
  contentType?: string;
};

export const presignPutObject = async ({
  bucket,
  key,
  expiresIn = 900,
  contentType,
}: PresignPutInput) => {
  const client = resolveS3Client();
  if (!client) {
    throw new Error("S3 credentials not configured");
  }
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(contentType ? { ContentType: contentType } : {}),
  });
  return getSignedUrl(client, command, { expiresIn });
};
