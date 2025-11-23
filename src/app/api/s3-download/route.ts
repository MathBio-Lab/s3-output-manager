import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '@/lib/config';
import { getAuthUser, getUserPrefix } from '@/lib/auth';

const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

export async function GET(request: NextRequest) {
    // Get authenticated user
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userPrefix = getUserPrefix(user);

    const key = searchParams.get('key');

    if (!key) {
        return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Security check: Ensure key starts with userPrefix
    if (!key.startsWith(userPrefix)) {
        return NextResponse.json({ error: 'Access denied: Invalid key' }, { status: 403 });
    }

    const fullKey = key;

    try {
        const command = new GetObjectCommand({
            Bucket: config.aws.bucketName,
            Key: fullKey,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }
}
