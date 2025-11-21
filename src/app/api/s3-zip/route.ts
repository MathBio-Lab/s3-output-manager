import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import archiver from 'archiver';
import { PassThrough } from 'stream';
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
    const prefix = searchParams.get('prefix');

    if (!prefix) {
        return NextResponse.json({ error: 'Prefix is required' }, { status: 400 });
    }

    const normalizedRootPrefix = getRootPrefix();
    const fullPrefix = normalizedRootPrefix + prefix;

    try {
        // List all objects in the folder
        const listCommand = new ListObjectsV2Command({
            Bucket: config.aws.bucketName,
            Prefix: fullPrefix,
        });

        const listResponse = await s3Client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return NextResponse.json({ error: 'Folder is empty or does not exist' }, { status: 404 });
        }

        // Create a PassThrough stream to pipe the zip output to the response
        const passThrough = new PassThrough();
        const archive = archiver('zip', {
            zlib: { level: 9 }, // Sets the compression level.
        });

        archive.on('error', (err) => {
            console.error('Archiver error:', err);
            passThrough.end(); // End the stream on error
        });

        // Pipe archive data to the response stream
        archive.pipe(passThrough);

        // Process files asynchronously
        (async () => {
            const contents = listResponse.Contents || [];
            for (const item of contents) {
                if (!item.Key || item.Key.endsWith('/')) continue; // Skip folders themselves if listed

                try {
                    const getCommand = new GetObjectCommand({
                        Bucket: config.aws.bucketName,
                        Key: item.Key,
                    });

                    const getResponse = await s3Client.send(getCommand);

                    if (getResponse.Body) {
                        // The file name in the zip should be relative to the requested folder
                        // We need to strip the fullPrefix from the item.Key to get the relative path inside the zip
                        const name = item.Key.replace(fullPrefix, '');
                        // @ts-ignore - AWS SDK stream type compatibility issue
                        archive.append(getResponse.Body, { name });
                    }
                } catch (err) {
                    console.error(`Failed to add file ${item.Key} to zip:`, err);
                }
            }
            await archive.finalize();
        })();

        // Return the stream as the response
        return new NextResponse(passThrough as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${prefix.replace(/\/$/, '').split('/').pop()}.zip"`,
            },
        });

    } catch (error) {
        console.error('Error zipping folder:', error);
        return NextResponse.json({ error: 'Failed to zip folder' }, { status: 500 });
    }
}
