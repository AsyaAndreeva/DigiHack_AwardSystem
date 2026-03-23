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

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ No DATABASE_URL found');
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);

    try {
        console.log('Running schema migrations...');

        // 1. Delete orphaned evaluation rows first (where team_id or jury_id doesn't exist)
        await sql`
            DELETE FROM evaluations 
            WHERE team_id NOT IN (SELECT id FROM teams)
               OR jury_id NOT IN (SELECT id FROM jury_members)
               OR jury_id IS NULL
        `;
        console.log('✅ Cleaned up orphaned evaluations');

        // 2. Delete orphaned team_profiles
        await sql`
            DELETE FROM team_profiles
            WHERE team_id NOT IN (SELECT id FROM teams)
        `;
        console.log('✅ Cleaned up orphaned team profiles');

        // 3. Add Foreign Keys and constraints to evaluations
        await sql`
            ALTER TABLE evaluations
            ALTER COLUMN jury_id SET NOT NULL,
            ADD CONSTRAINT fk_evaluations_team 
                FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            ADD CONSTRAINT fk_evaluations_jury 
                FOREIGN KEY (jury_id) REFERENCES jury_members(id) ON DELETE CASCADE
        `;
        console.log('✅ Added foreign keys to evaluations');

        // 4. Add Foreign Keys to team_profiles
        await sql`
            ALTER TABLE team_profiles
            ADD CONSTRAINT fk_team_profiles_team
                FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        `;
        console.log('✅ Added foreign keys to team_profiles');

        // 5. Drop redundant columns from evaluations
        await sql`
            ALTER TABLE evaluations
            DROP COLUMN IF EXISTS team_name,
            DROP COLUMN IF EXISTS jury_name
        `;
        console.log('✅ Dropped redundant names from evaluations table');

        console.log('\n🎉 Migration completed successfully!');
    } catch (err) {
        console.error('DB Error:', err.message);
    }
}

migrate();
