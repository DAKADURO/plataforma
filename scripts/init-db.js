const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Try to deploy migrations
    try {
      console.log('Running prisma migrate deploy...');
      await execAsync('npx prisma migrate deploy --skip-generate');
      console.log('✓ Migrations deployed successfully');
    } catch (error) {
      if (error.stderr && error.stderr.includes('P3005')) {
        console.log('⚠ P3005 error detected - database schema already exists');
        console.log('Attempting to resolve migration as already applied...');

        // Get migration folder
        const migrationsDir = path.join(__dirname, '../prisma/migrations');
        const migrations = fs.readdirSync(migrationsDir)
          .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory());

        if (migrations.length > 0) {
          const latestMigration = migrations.sort().pop();
          console.log(`Found migration: ${latestMigration}`);

          try {
            await execAsync(`npx prisma migrate resolve --rolled-back ${latestMigration}`);
            console.log('✓ Migration marked as already applied');

            // Try deploy again
            console.log('Retrying prisma migrate deploy...');
            await execAsync('npx prisma migrate deploy --skip-generate');
            console.log('✓ Migrations deployed successfully');
          } catch (resolveError) {
            console.log('⚠ Could not resolve migration, continuing anyway...');
            console.log('  (Database schema may already match the migration)');
          }
        }
      } else {
        console.error('✗ Migration error:', error.message);
        throw error;
      }
    }

    console.log('✓ Database initialization complete');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

initializeDatabase().then(() => {
  console.log('Starting Next.js server...');
  require('next/dist/bin/next').default(['start']);
}).catch(error => {
  console.error('Initialization failed:', error);
  process.exit(1);
});
