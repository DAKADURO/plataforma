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

    // Try to deploy migrations, but don't fail on P3005 or other expected errors
    try {
      await runCommand('npx', ['prisma', 'migrate', 'deploy']);
      console.log('✓ Migrations deployed');
    } catch (error) {
      // Expected for existing databases: P3005 (schema not empty), migration conflicts, etc.
      console.log('⚠ Migration error (this may be normal for existing databases)');
      // Continue anyway - the schema might already exist
    }

    console.log('Starting Next.js server...');
    await runCommand('next', ['start']);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

start();
