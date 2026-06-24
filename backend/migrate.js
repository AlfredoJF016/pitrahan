const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

async function runMigration() {
    try {
        const sqlFilePath = path.join(__dirname, 'schema_profile_alter.sql');
        let sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Strip single line comments: -- ...
        sqlContent = sqlContent.replace(/--.*$/gm, '');

        // Split by semicolons
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Found ${statements.length} SQL statements to execute.`);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (stmt.toUpperCase().startsWith('USE ')) {
                console.log(`Skipping: ${stmt}`);
                continue;
            }
            console.log(`Executing statement ${i + 1}/${statements.length}...`);
            try {
                await pool.query(stmt);
                console.log(`Statement ${i + 1} executed successfully.`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
                    console.log(`Column already exists. Skipping.`);
                } else if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.errno === 1050) {
                    console.log(`Table already exists. Skipping.`);
                } else {
                    throw err;
                }
            }
        }

        console.log('Database migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

runMigration();
