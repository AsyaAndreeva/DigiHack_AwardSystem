const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const dbUrl = envLocal.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/)?.[1];

const sql = neon(dbUrl);

async function run() {
    try {
        const mentors = await sql`SELECT * FROM mentors`;
        console.log('Mentors:', mentors);
    } catch (e) {
        console.error(e);
    }
}

run();
