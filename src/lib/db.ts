import { config } from './config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: config.database.url,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
