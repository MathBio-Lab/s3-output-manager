import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from '@/lib/config';
import { getAuthUser, getUserPrefix } from '@/lib/auth';

const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { filename, contentType, prefix } = body;

        if (!filename) {
            return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
        }

        const userPrefix = getUserPrefix(user);
        const requestedPrefix = prefix ? (prefix.endsWith('/') ? prefix : prefix + '/') : '';

        // If no prefix provided, default to userPrefix
        const targetPrefix = requestedPrefix || userPrefix;

        // Security check
        if (!targetPrefix.startsWith(userPrefix)) {
            return NextResponse.json({ error: 'Access denied: Invalid prefix' }, { status: 403 });
        }

        const key = targetPrefix + filename;

        const command = new PutObjectCommand({
            Bucket: config.aws.bucketName,
            Key: key,
            ContentType: contentType || 'application/octet-stream',
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return NextResponse.json({ uploadUrl, key });
    } catch (error: unknown) {
        console.error('Error generating presigned URL:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to generate upload URL',
            details: errorMessage,
        }, { status: 500 });
    }
}
