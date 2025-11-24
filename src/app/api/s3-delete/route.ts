import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
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
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { key, type } = body;

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        const userPrefix = getUserPrefix(user);

        // Security check: Ensure key starts with userPrefix
        if (!key.startsWith(userPrefix)) {
            return NextResponse.json({ error: 'Access denied: Invalid key' }, { status: 403 });
        }

        if (type === 'folder') {
            // Delete folder (recursively delete all objects with this prefix)
            // Ensure folder key ends with /
            const folderPrefix = key.endsWith('/') ? key : key + '/';

            let continuationToken: string | undefined = undefined;

            do {
                // List objects to delete
                const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
                    Bucket: config.aws.bucketName,
                    Prefix: folderPrefix,
                    ContinuationToken: continuationToken,
                });

                const listResponse = await s3Client.send(listCommand);

                if (listResponse.Contents && listResponse.Contents.length > 0) {
                    const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key }));

                    const deleteCommand = new DeleteObjectsCommand({
                        Bucket: config.aws.bucketName,
                        Delete: {
                            Objects: objectsToDelete,
                            Quiet: true,
                        },
                    });

                    await s3Client.send(deleteCommand);
                }

                continuationToken = listResponse.NextContinuationToken;
            } while (continuationToken);

        } else {
            // Delete single file
            const command = new DeleteObjectCommand({
                Bucket: config.aws.bucketName,
                Key: key,
            });

            await s3Client.send(command);
        }

        return NextResponse.json({ success: true, message: 'Deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting S3 object:', error);
        return NextResponse.json({
            error: 'Failed to delete',
            details: error.message
        }, { status: 500 });
    }
}
