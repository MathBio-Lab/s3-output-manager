import { config } from '../lib/config';

console.log("DATABASE_URL:", config.database.url);
console.log("AWS_REGION:", config.aws.region);
console.log("AWS_BUCKET_NAME:", config.aws.bucketName);
console.log("NODE_ENV:", config.app.nodeEnv);
console.log("IS_PRODUCTION:", config.app.isProduction);
