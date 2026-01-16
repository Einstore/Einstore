import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export const resolveS3Client = () => {
    const isLocal = process.env.NODE_ENV !== "production";
    const region = process.env.SPACES_REGION || "us-east-1";
    const endpoint = process.env.SPACES_ENDPOINT || (isLocal ? "http://localhost:9000" : undefined);
    const accessKeyId = process.env.SPACES_KEY || (isLocal ? "minio" : undefined);
    const secretAccessKey = process.env.SPACES_SECRET || (isLocal ? "minio123" : undefined);
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
export const presignStorageObject = async ({ bucket, key, expiresIn, responseContentDisposition, }) => {
    const client = resolveS3Client();
    if (!client) {
        throw new Error("S3 credentials not configured");
    }
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(responseContentDisposition ? { ResponseContentDisposition: responseContentDisposition } : {}),
    });
    return getSignedUrl(client, command, { expiresIn });
};
export const presignPutObject = async ({ bucket, key, expiresIn = 900, contentType, }) => {
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
