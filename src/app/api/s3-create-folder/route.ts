import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    // Get authenticated user
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { parentPath, folderName } = await request.json();

        if (!folderName) {
            return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
        }

        // Validate folder name (basic validation)
        if (folderName.includes('/') || folderName.includes('\\')) {
            return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 });
        }

        // Get user's prefix
        const userPrefix = getUserPrefix(user);

        // Ensure parentPath starts with userPrefix
        // parentPath comes from the frontend's currentPath, which should already be validated there,
        // but we must double-check here for security.
        let targetPath = parentPath || '';

        // If targetPath is empty, it means root.
        // If user has a prefix, targetPath must start with it.
        if (!targetPath.startsWith(userPrefix)) {
            // If targetPath is empty and user has a prefix, we force it to userPrefix
            if (targetPath === '' && userPrefix) {
                targetPath = userPrefix;
            } else {
                return NextResponse.json({ error: 'Access denied: Invalid parent path' }, { status: 403 });
            }
        }

        // Construct the full key for the new folder
        // S3 folders are just objects ending with '/'
        const newFolderKey = `${targetPath}${targetPath.endsWith('/') ? '' : '/'}${folderName}/`;

        console.log('Creating folder:', {
            Bucket: config.aws.bucketName,
            Key: newFolderKey,
            User: user.username
        });

        const command = new PutObjectCommand({
            Bucket: config.aws.bucketName,
            Key: newFolderKey,
            Body: '', // Empty body for folder
        });

        await s3Client.send(command);

        return NextResponse.json({ success: true, path: newFolderKey });

    } catch (error: any) {
        console.error('Error creating folder:', error);
        return NextResponse.json({
            error: 'Failed to create folder',
            details: error.message,
        }, { status: 500 });
    }
}
