import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from '../lib/config';

const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

async function listAll() {
    try {
        const command = new ListObjectsV2Command({
            Bucket: config.aws.bucketName,
            Delimiter: '/',
            Prefix: '', // Listar desde la raíz
        });

        const response = await s3Client.send(command);

        console.log('--- CARPETAS EN LA RAÍZ ---');
        response.CommonPrefixes?.forEach(p => console.log(`📁 ${p.Prefix}`));

        console.log('\n--- ARCHIVOS EN LA RAÍZ ---');
        response.Contents?.forEach(c => console.log(`📄 ${c.Key}`));

        // Simular lógica exacta de la API
        const userPrefix = 'ref_GRCh37/';
        const requestedPrefix = '';
        const fullPrefix = userPrefix + requestedPrefix;

        console.log(`\n--- SIMULACIÓN API (Prefix: "${fullPrefix}") ---`);

        const apiCommand = new ListObjectsV2Command({
            Bucket: config.aws.bucketName,
            Prefix: fullPrefix,
            Delimiter: '/',
        });

        const apiResponse = await s3Client.send(apiCommand);
        console.log('CommonPrefixes:', apiResponse.CommonPrefixes?.length || 0);
        console.log('Contents:', apiResponse.Contents?.length || 0);

        if (apiResponse.Contents) {
            apiResponse.Contents.forEach(c => console.log(`� Key: ${c.Key}`));
        }
        if (apiResponse.CommonPrefixes) {
            apiResponse.CommonPrefixes.forEach(p => console.log(`� Prefix: ${p.Prefix}`));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listAll();
