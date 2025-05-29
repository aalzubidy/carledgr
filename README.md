# CarFin Backend

A NodeJS backend application for car dealerships to track inventory, maintenance, and financial information.

## Features

- **Authentication** - User registration and login with JWT authentication
- **Multi-organization Support** - Each dealership has its own data space
- **Car Inventory Management** - Track cars by make, model, year, VIN, purchase and sale information
- **Maintenance Tracking** - Record and categorize maintenance performed on vehicles
- **Financial Reporting** - Generate reports on inventory, sales, maintenance costs, and profits
- **Dashboard** - View key metrics about inventory, sales, and maintenance

## Technology Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Winston** - Logging

## Getting Started

### Prerequisites

- Node.js (v14+)
- MySQL (v8+)

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/carfin-backend.git
cd carfin-backend
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file based on `.env.example`
```
cp .env.example .env
```

4. Update the `.env` file with your MySQL database settings

5. Create the MySQL database
```
mysql -u root -p
CREATE DATABASE carfin;
exit
```

6. Start the server
```
npm start
```

The server will run on port 3000 by default (or the PORT specified in your .env file).

### Development

To run the server in development mode with auto-restart:
```
npm run dev
```

## API Documentation

### Authentication

- `POST /api/auth/organizations` - Get all organizations (for login dropdown)
- `POST /api/auth/login` - Login with organization, email, password
- `POST /api/auth/register` - Register a new user (requires admin/org_admin role)
- `GET /api/auth/me` - Get current user profile

### Organizations

- `GET /api/organizations` - List organizations (admin only)
- `POST /api/organizations` - Create organization (admin only)
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization (admin only)

### Cars

- `GET /api/cars` - List cars (filtered by user's organization)
- `POST /api/cars` - Add new car
- `GET /api/cars/:id` - Get car details
- `PUT /api/cars/:id` - Update car
- `DELETE /api/cars/:id` - Delete car
- `GET /api/cars/search` - Search cars by make/model/year/vin
- `GET /api/cars/statistics` - Get car statistics

### Maintenance

- `GET /api/maintenance/car/:carId` - List maintenance records for car
- `POST /api/maintenance` - Add maintenance record
- `GET /api/maintenance/:id` - Get maintenance record details
- `PUT /api/maintenance/:id` - Update maintenance record
- `DELETE /api/maintenance/:id` - Delete maintenance record
- `GET /api/maintenance/categories` - Get maintenance categories
- `POST /api/maintenance/categories` - Create maintenance category
- `PUT /api/maintenance/categories/:id` - Update maintenance category
- `DELETE /api/maintenance/categories/:id` - Delete maintenance category
- `GET /api/maintenance/statistics` - Get maintenance statistics

### Reports

- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/maintenance` - Maintenance cost report
- `GET /api/reports/profit` - Profit report

### Dashboard

- `GET /api/dashboard/summary` - Summary metrics
- `GET /api/dashboard/top-maintenance` - Top maintenance categories
- `GET /api/dashboard/car-metrics` - Car type metrics

## Default Admin User

Upon first run, the system will create a default admin organization and user:

- **Organization**: Admin Organization
- **Email**: admin@carfin.com
- **Password**: admin123

Please change this password immediately after first login. 