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

async function testConstraints() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ No DATABASE_URL found');
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    console.log('Testing constraints...');
    try {
        await sql`
            INSERT INTO evaluations (jury_id, team_id, scores, total_score, comments)
            VALUES (
                'fake-jury-999',
                'fake-team-999',
                '{"1": 3}'::jsonb,
                3,
                'This should fail'
            )
        `;
        console.error('❌ FAIL: Insert succeeded when it should have blocked due to foreign key constraints!');
    } catch (err) {
        if (err.message.includes('foreign key constraint')) {
            console.log('✅ PASS: Database successfully blocked insertion with fake IDs! (' + err.message + ')');
        } else {
            console.error('❌ FAIL: Got an error, but not a foreign key error:', err.message);
        }
    }
}

testConstraints();
