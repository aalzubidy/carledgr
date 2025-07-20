# CarLedgr Admin Panel

A simple, local-only admin control panel for managing CarLedgr organizations and users.

## Features

- 🏢 **Organization Management**: Create, edit, and delete organizations
- 👥 **User Management**: Create users with automatic email notifications
- 📄 **License Management**: Assign and manage license tiers
- ✉️ **Email Integration**: Automatic welcome emails with temporary passwords
- 🔧 **Health Monitoring**: Database and email configuration status
- 🎨 **Modern UI**: Bootstrap-based responsive interface

## Quick Start

### 1. Setup Configuration

Copy the example config file and customize it:

```bash
cp config/config.example.json config/config.json
```

Edit `config/config.json` with your settings:

```json
{
  "app": {
    "port": 3031,
    "environment": "development"
  },
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your-database-password",
    "database": "carledgr"
  },
  "email": {
    "host": "smtp.resend.com",
    "port": 587,
    "secure": false,
    "user": "resend",
    "password": "your-resend-api-key",
    "fromName": "CarLedgr Admin",
    "fromEmail": "admin@carledgr.com"
  }
}
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Admin Panel

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The admin panel will be available at: **http://localhost:3031**

## Configuration Options

### Environment Variables

You can override any config setting using environment variables with the `CL_ADMIN_` prefix:

```bash
export CL_ADMIN_PORT=3032
export CL_ADMIN_DB_PASSWORD=mypassword
export CL_ADMIN_EMAIL_PASSWORD=myresendkey
npm start
```

### Custom Config File

Use a custom config file location:

```bash
export CL_ADMIN_CONFIG_FILE=/path/to/custom-config.json
npm start
```

## Usage Guide

### Organization Management

1. **Create Organization**:
   - Click "Add Organization" button
   - Fill in organization details
   - Select license tier (optional)
   - Save to create

2. **Assign Licenses**:
   - Choose from available license tiers
   - Set car limits
   - Mark as free account if needed
   - Specify free account reason

3. **Edit/Delete**:
   - Use action buttons in the table
   - View user count and statistics

### User Management

1. **Create User**:
   - Select organization and role
   - Enter user details
   - System generates random password
   - Email sent automatically (optional)

2. **Password Reset**:
   - Click reset password button
   - New temporary password generated
   - Email sent to user

3. **Filter Users**:
   - Filter by organization
   - View all users across organizations

## API Endpoints

### Organizations
- `GET /api/organizations` - List all organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `GET /api/organizations/data/license-tiers` - Get license tiers

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-password` - Reset user password
- `GET /api/users/data/roles` - Get user roles

### Health Check
- `GET /api/health` - System health status

## Security Notes

⚠️ **Important**: This admin panel is designed for local use only and has no authentication. 

- **Do not expose to the internet**
- **Use only on trusted networks**
- **Access database and email credentials are stored in config**
- **All operations are logged to console**

## Troubleshooting

### Database Connection Issues

1. Check database credentials in config
2. Ensure MySQL server is running
3. Verify database exists and user has permissions

### Email Not Sending

1. Check email configuration in config
2. Verify Resend API key is valid
3. Test email config using health check

### Port Already in Use

Change the port in config or set environment variable:

```bash
export CL_ADMIN_PORT=3032
npm start
```

### License Tiers Not Loading

Ensure the `license_tiers` table exists in your database with sample data.

## Development

### Project Structure

```
admincp/
├── config/                 # Configuration files
│   ├── config.example.json # Example configuration
│   └── index.js           # Config loader
├── db/                    # Database utilities
│   └── connection.js      # Database connection
├── public/                # Frontend files
│   ├── index.html         # Main HTML interface
│   ├── app.js            # JavaScript application
│   └── style.css         # CSS styles
├── routes/                # API routes
│   ├── organizations.js  # Organizations endpoints
│   └── users.js          # Users endpoints
├── utils/                 # Utility functions
│   ├── emailService.js   # Email sending
│   └── passwordUtils.js  # Password generation
├── package.json          # Dependencies
├── server.js             # Main server file
└── README.md             # This file
```

### Adding New Features

1. **Backend**: Add routes in `routes/` directory
2. **Frontend**: Update `public/app.js` and `public/index.html`
3. **Database**: Add queries in route handlers
4. **Styling**: Modify `public/style.css`

## Support

This admin panel is designed to work with the existing CarLedgr database schema. Ensure your database has the following tables:

- `organizations`
- `users`
- `user_roles`
- `organization_licenses`
- `license_tiers`

For database schema questions, refer to the main CarLedgr backend documentation. 