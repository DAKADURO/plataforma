#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function start() {
  try {
    console.log('Initializing database...');

    // For Supabase/managed databases, use db push to sync schema
    // This is more suitable than migrations for existing databases
    try {
      await runCommand('npx', ['prisma', 'db', 'push', '--skip-generate']);
      console.log('✓ Database schema synchronized');
    } catch (error) {
      console.log('⚠ Database sync error - attempting to continue');
      console.log('   (This may occur if database connection is slow)');
      // Continue anyway - the schema might already be up to date
    }

    console.log('Starting Next.js server...');
    await runCommand('next', ['start']);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

start();
