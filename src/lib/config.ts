export const config = {
    aws: {
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
        bucketName: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || '',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        rootPrefix: process.env.S3_ROOT_PREFIX || '',
    },
    auth: {
        adminPassword: process.env.ADMIN_PASSWORD || '',
    },
};

// Helper to ensure root prefix ends with a slash if it exists
export const getRootPrefix = () => {
    const prefix = config.aws.rootPrefix;
    return prefix && !prefix.endsWith('/') ? `${prefix}/` : prefix;
};
