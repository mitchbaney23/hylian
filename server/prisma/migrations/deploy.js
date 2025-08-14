const { execSync } = require('child_process');

console.log('Running database migrations...');

try {
  // Run Prisma migrations in production
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
  });
  
  console.log('✅ Database migrations completed successfully');
} catch (error) {
  console.error('❌ Database migration failed:', error.message);
  process.exit(1);
}