import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
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

    // Get user's prefix (empty for admin, specific folder for clients)
    const userPrefix = getUserPrefix(user);

    // The prefix requested by the frontend
    let requestedPrefix = searchParams.get('prefix') || '';

    // If requestedPrefix is empty, start at userPrefix
    if (!requestedPrefix) {
        requestedPrefix = userPrefix;
    }

    // Fix: If requestedPrefix is exactly userPrefix but without the trailing slash, add it.
    if (requestedPrefix + '/' === userPrefix) {
        requestedPrefix = userPrefix;
    }

    // Security check: Ensure requestedPrefix starts with userPrefix
    if (!requestedPrefix.startsWith(userPrefix)) {
        console.log('Access denied:', { requestedPrefix, userPrefix });
        return NextResponse.json({ error: 'Access denied: Invalid prefix' }, { status: 403 });
    }

    const fullPrefix = requestedPrefix;

    try {
        console.log('Listing S3:', { Bucket: config.aws.bucketName, Prefix: fullPrefix, User: user.username });

        const command = new ListObjectsV2Command({
            Bucket: config.aws.bucketName,
            Prefix: fullPrefix,
            Delimiter: '/',
        });

        console.log('Listing S3 objects with params:', {
            Bucket: config.aws.bucketName,
            Prefix: fullPrefix,
            Region: config.aws.region,
            User: user.username,
            UserType: user.type,
        });

        const response = await s3Client.send(command);
        console.log('S3 Response:', {
            CommonPrefixes: response.CommonPrefixes?.length,
            Contents: response.Contents?.length,
        });

        const folders = (response.CommonPrefixes || []).map((p) => {
            // Name is the part after the requested prefix
            // p.Prefix is like "user/folder/subfolder/"
            // requestedPrefix is like "user/folder/"
            // Result name should be "subfolder"
            const name = p.Prefix?.replace(requestedPrefix, '').replace(/\/$/, '') || '';

            return {
                name: name,
                path: p.Prefix || '',
                type: 'folder',
            };
        });

        const files = (response.Contents || [])
            .filter((c) => c.Key !== fullPrefix) // Exclude the folder itself if it appears
            .map((c) => {
                // Name is the part after the requested prefix
                const name = c.Key?.replace(requestedPrefix, '') || '';

                return {
                    name: name,
                    path: c.Key || '',
                    size: c.Size,
                    lastModified: c.LastModified,
                    type: 'file',
                };
            });

        console.log('Mapped Items:', { folders: folders.length, files: files.length });
        if (folders.length > 0) console.log('Sample folder:', folders[0]);
        if (files.length > 0) console.log('Sample file:', files[0]);

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
