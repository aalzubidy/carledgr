# Database Sync Tool

Simple Node.js script to backup and sync MySQL databases between environments.

## Setup

1. **Configure databases** in `db-config.json`:
```json
{
  "dbFrom": {
    "host": "production-server.com",
    "port": 3306,
    "user": "db_user",
    "password": "db_password", 
    "database": "carfin_prod",
    "ssl": true
  },
  "dbTo": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "localpass",
    "database": "carfin_dev",
    "ssl": false
  }
}
```

2. **Ensure MySQL tools are installed**:
```bash
# Ubuntu/Debian
sudo apt install mysql-client

# macOS
brew install mysql-client
```

## Usage

```bash
# Pull database from source (creates backup.sql)
node db-sync.js --pull

# Push database to target (clears target first)  
node db-sync.js --push

# Pull and push in one command (pull runs first, then push)
node db-sync.js --pull --push

# Show help
node db-sync.js
```

## What it does

- **Pull (`--pull`)**: Creates `backup.sql` from `dbFrom` database
- **Push (`--push`)**: Drops `dbTo` database, recreates it, and imports backup.sql

## Notes

- ⚠️ **Push operation deletes all data** in target database first
- Backup file is stored in `backup.sql` (same directory as script)
- Script includes MySQL routines and triggers in backup
- File size is displayed after backup completion
- **SSL Support**: Set `"ssl": true` for databases requiring SSL connections
- SSL connections use `--ssl-mode=REQUIRED` without certificate validation

## Examples

```bash
# Backup production to local file
node db-sync.js --pull

# Copy production to staging
# (Configure dbFrom=prod, dbTo=staging in db-config.json)
node db-sync.js --pull --push

# Restore local backup to development
node db-sync.js --push
``` 