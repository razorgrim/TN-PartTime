import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

export async function initializeDatabase() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  const dbName = process.env.DB_NAME || 'tn_parttime';

  // 1. Create database if it doesn't exist
  try {
    const tempConnection = await mysql.createConnection(connectionConfig);
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();
  } catch (error) {
    console.error("Failed to connect to MySQL/MariaDB or create database. Make sure it is running.", error);
    throw error;
  }

  // 2. Initialize connection pool
  pool = mysql.createPool({
    ...connectionConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  // 3. Create tables and seed data
  try {
    const connection = await pool.getConnection();

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icNumber VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'part-timer') NOT NULL,
        status ENUM('enabled', 'disabled', 'pending') DEFAULT 'enabled',
        createdAt VARCHAR(100) NOT NULL,
        bankName VARCHAR(255) DEFAULT NULL,
        bankAccount VARCHAR(255) DEFAULT NULL,
        bankHolder VARCHAR(255) DEFAULT NULL
      ) ENGINE=InnoDB;
    `);

    // Create jobs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        locationName TEXT NOT NULL,
        payRate DECIMAL(10, 2) NOT NULL,
        date VARCHAR(100) NOT NULL,
        time VARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8) DEFAULT NULL,
        longitude DECIMAL(11, 8) DEFAULT NULL
      ) ENGINE=InnoDB;
    `);

    // Dynamically add latitude and longitude columns to jobs if they don't exist
    try {
      await connection.query(`ALTER TABLE jobs ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL`);
    } catch (e) {
      // Ignore if column already exists
    }
    try {
      await connection.query(`ALTER TABLE jobs ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL`);
    } catch (e) {
      // Ignore if column already exists
    }
    try {
      await connection.query(`ALTER TABLE jobs ADD COLUMN description TEXT DEFAULT NULL`);
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await connection.query(`ALTER TABLE users ADD COLUMN bankName VARCHAR(255) DEFAULT NULL`);
    } catch (e) {
      // Ignore if column already exists
    }
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN bankAccount VARCHAR(255) DEFAULT NULL`);
    } catch (e) {
      // Ignore if column already exists
    }
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN bankHolder VARCHAR(255) DEFAULT NULL`);
    } catch (e) {
      // Ignore if column already exists
    }

    // Create shifts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id VARCHAR(255) PRIMARY KEY,
        jobId VARCHAR(255) NOT NULL,
        jobTitle VARCHAR(255) NOT NULL,
        locationName TEXT NOT NULL,
        payRate DECIMAL(10, 2) NOT NULL,
        payout DECIMAL(10, 2) DEFAULT NULL,
        claimStatus VARCHAR(100) DEFAULT NULL,
        workerId VARCHAR(255) NOT NULL,
        workerName VARCHAR(255) NOT NULL,
        status ENUM('active', 'completed') DEFAULT 'active',
        clockInTime VARCHAR(100) NOT NULL,
        clockInDistance DECIMAL(10, 2) NOT NULL,
        clockOutTime VARCHAR(100) DEFAULT NULL,
        clockOutDistance DECIMAL(10, 2) DEFAULT NULL,
        durationMinutes INT DEFAULT NULL
      ) ENGINE=InnoDB;
    `);

    // Seed default users if empty
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      console.log('No users found. Seeding default users...');
      await connection.query(`
        INSERT INTO users (id, name, icNumber, email, phone, password, role, status, createdAt)
        VALUES 
        ('admin-1', 'System Admin', 'N/A', 'admin@neutron.com', '012-3456789', 'abc123456', 'admin', 'enabled', '2026-06-01T08:00:00Z'),
        ('pt-1', 'Ahmad Syamil', '980712-14-5543', 'ahmad@parttime.com', '0198765432', 'password123', 'part-timer', 'enabled', '2026-06-15T09:30:00Z'),
        ('pt-2', 'Beatrice Tan', '010314-08-6622', 'beatrice@parttime.com', '0112345678', 'password123', 'part-timer', 'pending', '2026-06-20T10:15:00Z')
      `);
    }

    // Seed default jobs if empty
    const [jobRows] = await connection.query('SELECT COUNT(*) as count FROM jobs');
    if (jobRows[0].count === 0) {
      console.log('No jobs found. Seeding default jobs...');
      await connection.query(`
        INSERT INTO jobs (id, title, locationName, payRate, date, time, latitude, longitude)
        VALUES 
        ('job-1', 'Office IT Setup Assistant', 'Kuala Lumpur Convention Centre (KLCC), Hall 4', 150.00, '2026-06-25', '09:00 AM - 06:00 PM', 3.15790000, 101.71160000),
        ('job-2', 'Network Cabling Assistant', 'Mid Valley Megamall, South Court', 120.00, '2026-06-26', '10:00 AM - 07:00 PM', 3.11860000, 101.67610000)
      `);
    }

    // Seed default shifts if empty
    const [shiftRows] = await connection.query('SELECT COUNT(*) as count FROM shifts');
    if (shiftRows[0].count === 0) {
      console.log('No shifts found. Seeding default shifts...');
      await connection.query(`
        INSERT INTO shifts (id, jobId, jobTitle, locationName, payRate, payout, claimStatus, workerId, workerName, status, clockInTime, clockInDistance, clockOutTime, clockOutDistance, durationMinutes)
        VALUES 
        ('shift-1', 'job-1', 'Office IT Setup Assistant', 'Kuala Lumpur Convention Centre (KLCC), Hall 4', 150.00, 150.00, 'approved', 'pt-1', 'Ahmad Syamil', 'completed', '2026-06-20T09:00:00Z', 35.00, '2026-06-20T11:30:00Z', 45.00, 150)
      `);
    }

    connection.release();
  } catch (error) {
    console.error("Failed to initialize database tables or seed data:", error);
    throw error;
  }
}

export function getDb() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return pool;
}
