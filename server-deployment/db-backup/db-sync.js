#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load configuration
const configPath = path.join(__dirname, 'db-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ db-config.json not found!');
  console.log('Please create db-config.json with dbFrom and dbTo configurations.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const backupFile = path.join(__dirname, 'backup.sql');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldPull = args.includes('--pull') || args.includes('-pull');
const shouldPush = args.includes('--push') || args.includes('-push');

if (!shouldPull && !shouldPush) {
  console.log('📖 Usage: node db-sync.js [--pull] [--push]');
  console.log('  --pull: Download database from dbFrom');
  console.log('  --push: Upload database to dbTo');
  console.log('  You can use both flags together (pull runs first, then push)');
  process.exit(0);
}

// Helper function to build MySQL connection string
function buildConnectionString(dbConfig) {
  let connStr = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user}`;
  if (dbConfig.password) {
    connStr += ` -p${dbConfig.password}`;
  }
  if (dbConfig.ssl) {
    connStr += ` --ssl-mode=REQUIRED --ssl-ca=/dev/null`;
  }
  return connStr;
}

// Pull database (backup from source)
async function pullDatabase() {
  try {
    console.log('📥 Pulling database from source...');
    console.log(`🔗 Connecting to: ${config.dbFrom.host}:${config.dbFrom.port}`);
    
    const { dbFrom } = config;
    
    // First test the connection
    console.log('🔍 Testing database connection...');
    let testCommand = `mysql -h ${dbFrom.host} -P ${dbFrom.port} -u ${dbFrom.user} -p${dbFrom.password}`;
    if (dbFrom.ssl) {
      testCommand += ` --ssl-mode=REQUIRED --ssl-ca=/dev/null`;
    }
    testCommand += ` -e "SELECT 1" ${dbFrom.database}`;
    
    console.log('⏳ Connecting...');
    execSync(testCommand, { stdio: 'pipe', timeout: 10000 });
    console.log('✅ Connection successful!');
    
    // Now do the actual dump
    let dumpCommand = `mysqldump -h ${dbFrom.host} -P ${dbFrom.port} -u ${dbFrom.user} -p${dbFrom.password} --single-transaction --routines --triggers --no-tablespaces`;
    
    if (dbFrom.ssl) {
      dumpCommand += ` --ssl-mode=REQUIRED --ssl-ca=/dev/null`;
    }
    
    dumpCommand += ` ${dbFrom.database} > ${backupFile}`;
    
    console.log(`🔄 Backing up database: ${dbFrom.database}`);
    console.log('⏳ This may take a while for large databases...');
    
    // Show progress by checking file size periodically
    const startTime = Date.now();
    const dumpProcess = require('child_process').spawn('bash', ['-c', dumpCommand]);
    
    const progressInterval = setInterval(() => {
      try {
        if (fs.existsSync(backupFile)) {
          const stats = fs.statSync(backupFile);
          const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          process.stdout.write(`\r📊 Progress: ${fileSizeInMB} MB downloaded (${elapsed}s elapsed)...`);
        }
      } catch (e) {
        // Ignore errors during progress check
      }
    }, 2000);
    
    await new Promise((resolve, reject) => {
      dumpProcess.on('close', (code) => {
        clearInterval(progressInterval);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mysqldump exited with code ${code}`));
        }
      });
      
      dumpProcess.on('error', (error) => {
        clearInterval(progressInterval);
        reject(error);
      });
    });
    
    console.log('\n✅ Database backup completed!');
    
    // Show final file size
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Final backup file size: ${fileSizeInMB} MB`);
    
  } catch (error) {
    console.error('❌ Pull failed:', error.message);
    if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timed out. Check your network connection and database credentials.');
    }
    process.exit(1);
  }
}

// Push database (restore to target)
async function pushDatabase() {
  try {
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Backup file not found: ${backupFile}`);
      console.log('Run with --pull first to create a backup file');
      process.exit(1);
    }
    
    console.log('📤 Pushing database to target...');
    console.log(`🔗 Connecting to: ${config.dbTo.host}:${config.dbTo.port}`);
    
    const { dbTo } = config;
    
    // First test the connection
    console.log('🔍 Testing target database connection...');
    let testCommand = `mysql -h ${dbTo.host} -P ${dbTo.port} -u ${dbTo.user} -p${dbTo.password}`;
    if (dbTo.ssl) {
      testCommand += ` --ssl-mode=REQUIRED --ssl-ca=/dev/null`;
    }
    testCommand += ` -e "SELECT 1"`;
    
    console.log('⏳ Connecting to target...');
    execSync(testCommand, { stdio: 'pipe', timeout: 10000 });
    console.log('✅ Target connection successful!');
    
    // First, drop and recreate the database to ensure clean state
    console.log(`🗑️  Cleaning target database: ${dbTo.database}`);
    const cleanCommands = [
      `${buildConnectionString(dbTo)} -e "DROP DATABASE IF EXISTS \\\`${dbTo.database}\\\`;"`,
      `${buildConnectionString(dbTo)} -e "CREATE DATABASE \\\`${dbTo.database}\\\`;"`
    ];
    
    for (const cmd of cleanCommands) {
      console.log('⏳ Executing database cleanup...');
      execSync(cmd, { stdio: 'pipe' });
    }
    console.log('✅ Database cleanup completed!');
    
    // Import the backup
    console.log(`🔄 Importing backup to: ${dbTo.database}`);
    console.log('⏳ This may take a while for large databases...');
    
    const importCommand = `${buildConnectionString(dbTo)} ${dbTo.database} < ${backupFile}`;
    
    // Show progress during import
    const startTime = Date.now();
    const stats = fs.statSync(backupFile);
    const totalSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📊 Importing ${totalSizeInMB} MB of data...`);
    
    const importProcess = require('child_process').spawn('bash', ['-c', importCommand]);
    
    const progressInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      process.stdout.write(`\r⏳ Import in progress... (${elapsed}s elapsed)`);
    }, 2000);
    
    await new Promise((resolve, reject) => {
      importProcess.on('close', (code) => {
        clearInterval(progressInterval);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mysql import exited with code ${code}`));
        }
      });
      
      importProcess.on('error', (error) => {
        clearInterval(progressInterval);
        reject(error);
      });
    });
    
    console.log('\n✅ Database push completed successfully!');
    
  } catch (error) {
    console.error('❌ Push failed:', error.message);
    if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timed out. Check your network connection and database credentials.');
    }
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🚀 Database Sync Tool');
  console.log('=====================');
  
  // Always run pull first if both are specified
  if (shouldPull) {
    await pullDatabase();
    
    // Add separator if both operations are running
    if (shouldPush) {
      console.log('\n' + '='.repeat(50) + '\n');
    }
  }
  
  if (shouldPush) {
    await pushDatabase();
  }
  
  console.log('🎉 All operations completed!');
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}); 