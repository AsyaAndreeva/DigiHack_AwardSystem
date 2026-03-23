const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) process.env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
    });
}

const { neon } = require('@neondatabase/serverless');

async function getSchema() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ No DATABASE_URL found');
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    try {
        const schema = await sql`
            SELECT table_name, column_name, data_type, character_maximum_length, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        `;
        
        const constraints = await sql`
            SELECT
                tc.table_name, 
                tc.constraint_type,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            LEFT JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.table_schema = 'public';
        `;
        
        fs.writeFileSync('schema-dump.json', JSON.stringify({ schema, constraints }, null, 2));
        console.log('Schema saved to schema-dump.json');
    } catch (err) {
        console.error('DB Error:', err.message);
    }
}

getSchema();
