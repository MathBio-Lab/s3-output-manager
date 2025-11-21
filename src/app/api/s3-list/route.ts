import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config, getRootPrefix } from '@/lib/config';

const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const rootPrefix = config.aws.rootPrefix;
    // Ensure rootPrefix ends with / if it's not empty
    const normalizedRootPrefix = getRootPrefix();

    // The prefix requested by the frontend (relative to the rootPrefix)
    const requestedPrefix = searchParams.get('prefix') || '';

    // The actual prefix to send to S3
    const fullPrefix = normalizedRootPrefix + requestedPrefix;

    try {
        const command = new ListObjectsV2Command({
            Bucket: config.aws.bucketName,
            Prefix: fullPrefix,
            Delimiter: '/',
        });

        console.log('Listing S3 objects with params:', {
            Bucket: config.aws.bucketName,
            Prefix: fullPrefix,
            Region: config.aws.region,
        });

        const response = await s3Client.send(command);
        console.log('S3 Response:', {
            CommonPrefixes: response.CommonPrefixes?.length,
            Contents: response.Contents?.length,
        });

        const folders = (response.CommonPrefixes || []).map((p) => {
            // Remove the full prefix to get the relative name
            const relativePrefix = p.Prefix?.replace(normalizedRootPrefix, '') || '';
            return {
                name: relativePrefix.replace(requestedPrefix, '').replace('/', '') || '',
                path: relativePrefix || '',
                type: 'folder',
            };
        });

        const files = (response.Contents || [])
            .filter((c) => c.Key !== fullPrefix) // Exclude the folder itself if it appears
            .map((c) => {
                const relativeKey = c.Key?.replace(normalizedRootPrefix, '') || '';
                return {
                    name: relativeKey.replace(requestedPrefix, '') || '',
                    path: relativeKey || '',
                    size: c.Size,
                    lastModified: c.LastModified,
                    type: 'file',
                };
            });

        return NextResponse.json({ items: [...folders, ...files] });
    } catch (error: any) {
        console.error('Error listing S3 objects:', error);
        return NextResponse.json({
            error: 'Failed to list files',
            details: error.message,
            code: error.Code,
            requestId: error.$metadata?.requestId
        }, { status: 500 });
    }
}
