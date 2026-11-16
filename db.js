import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'clinica_pediatrica',
    password: 'amods',
    port: 7777,
});

export default pool;
