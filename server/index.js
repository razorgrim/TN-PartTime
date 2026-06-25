import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Helper to check uniqueness
async function checkUniqueness(db, table, column, value, excludeId = null) {
  let query = `SELECT COUNT(*) as count FROM ${table} WHERE LOWER(${column}) = LOWER(?)`;
  const params = [value];
  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }
  const [rows] = await db.query(query, params);
  return rows[0].count > 0;
}

// Helper to clean IC number for uniqueness check
async function checkIcUniqueness(db, icNumber, excludeId = null) {
  const cleanNew = icNumber.replace(/[^0-9a-zA-Z]/g, '');
  let query = `SELECT id, icNumber FROM users`;
  if (excludeId) {
    query += ` WHERE id != ?`;
  }
  const [rows] = await db.query(query, excludeId ? [excludeId] : []);
  return rows.some(u => u.icNumber.replace(/[^0-9a-zA-Z]/g, '') === cleanNew);
}

// Helper to extract last 4 digits of IC
const getICLast4 = (ic) => {
  if (!ic) return '';
  const clean = ic.replace(/[^0-9a-zA-Z]/g, '');
  return clean.slice(-4);
};

const validateRegistration = (name, icNumber, email, phone, password) => {
  if (!name || name.trim().length < 3) return 'Name must be at least 3 characters.';
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return 'Name can only contain letters, spaces, hyphens, and apostrophes.';

  const cleanIc = icNumber.trim().replace(/-/g, '');
  if (!/^\d{12}$/.test(cleanIc)) return 'IC Number must be exactly 12 digits.';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.';

  const cleanPhone = phone.trim().replace(/[-\s+]/g, '');
  if (!/^(?:60|0)1\d{7,9}$/.test(cleanPhone)) return 'Please enter a valid Malaysian phone number.';

  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Password must contain both letters and numbers.';

  return null;
};

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// Admin Login
app.post('/api/auth/login-admin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    const user = rows[0];

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Part-Timer Login
app.post('/api/auth/login-parttimer', async (req, res) => {
  const { icLast4, password } = req.body;
  if (!icLast4 || !password) {
    return res.status(400).json({ success: false, message: 'IC digits and password are required.' });
  }

  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM users WHERE role = "part-timer"');
    
    const cleanInputLast4 = icLast4.replace(/[^0-9a-zA-Z]/g, '');
    const user = rows.find(u => getICLast4(u.icNumber) === cleanInputLast4);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found with this IC (last 4 digits).' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Account pending approval. Please contact the administrator.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ success: false, message: 'Account disabled. Please contact the administrator.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Register Part-Timer
app.post('/api/auth/register', async (req, res) => {
  const { name, icNumber, email, phone, password, salutation } = req.body;
  
  const validationError = validateRegistration(name, icNumber, email, phone, password);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const cleanIc = icNumber.trim().replace(/-/g, '');
  const formattedIc = cleanIc.slice(0, 6) + '-' + cleanIc.slice(6, 8) + '-' + cleanIc.slice(8);
  
  let cleanPhone = phone.trim().replace(/[-\s+]/g, '');
  if (cleanPhone.startsWith('60')) {
    cleanPhone = '0' + cleanPhone.slice(2);
  }

  try {
    const db = getDb();

    if (await checkUniqueness(db, 'users', 'email', email.trim().toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Email address already registered.' });
    }
    if (await checkUniqueness(db, 'users', 'phone', cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Phone number already registered.' });
    }
    if (await checkIcUniqueness(db, formattedIc)) {
      return res.status(400).json({ success: false, message: 'IC Number already registered.' });
    }

    const id = 'pt-' + Date.now();
    const createdAt = new Date().toISOString();

    await db.query(`
      INSERT INTO users (id, name, icNumber, email, phone, password, role, status, createdAt, salutation)
      VALUES (?, ?, ?, ?, ?, ?, 'part-timer', 'pending', ?, ?)
    `, [id, name.trim(), formattedIc, email.trim().toLowerCase(), cleanPhone, password, createdAt, salutation || 'En.']);

    return res.json({ success: true, message: 'Registration successful! Awaiting admin approval.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ----------------------------------------------------
// USERS / STAFF ROUTES
// ----------------------------------------------------

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM users ORDER BY createdAt DESC');
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Add Staff (Admin)
app.post('/api/users', async (req, res) => {
  const { name, icNumber, email, phone, password, salutation } = req.body;
  
  const validationError = validateRegistration(name, icNumber, email, phone, password);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const cleanIc = icNumber.trim().replace(/-/g, '');
  const formattedIc = cleanIc.slice(0, 6) + '-' + cleanIc.slice(6, 8) + '-' + cleanIc.slice(8);
  
  let cleanPhone = phone.trim().replace(/[-\s+]/g, '');
  if (cleanPhone.startsWith('60')) {
    cleanPhone = '0' + cleanPhone.slice(2);
  }

  try {
    const db = getDb();

    if (await checkUniqueness(db, 'users', 'email', email.trim().toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Email address already registered.' });
    }
    if (await checkUniqueness(db, 'users', 'phone', cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Phone number already registered.' });
    }
    if (await checkIcUniqueness(db, formattedIc)) {
      return res.status(400).json({ success: false, message: 'IC Number already registered.' });
    }

    const id = 'pt-' + Date.now();
    const createdAt = new Date().toISOString();

    await db.query(`
      INSERT INTO users (id, name, icNumber, email, phone, password, role, status, createdAt, salutation)
      VALUES (?, ?, ?, ?, ?, ?, 'part-timer', 'enabled', ?, ?)
    `, [id, name.trim(), formattedIc, email.trim().toLowerCase(), cleanPhone, password, createdAt, salutation || 'En.']);

    const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return res.json({ success: true, message: `Staff member ${name} created successfully.`, user: newUser[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Update Staff (Admin)
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, icNumber, email, phone, password, salutation } = req.body;

  try {
    const db = getDb();

    // Verify user exists
    const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check uniqueness excluding current user
    if (email && await checkUniqueness(db, 'users', 'email', email, id)) {
      return res.status(400).json({ success: false, message: 'Email address already registered by another user.' });
    }
    if (phone && await checkUniqueness(db, 'users', 'phone', phone, id)) {
      return res.status(400).json({ success: false, message: 'Phone number already registered by another user.' });
    }
    if (icNumber && await checkIcUniqueness(db, icNumber, id)) {
      return res.status(400).json({ success: false, message: 'IC Number already registered by another user.' });
    }

    // Prepare update query
    let updateQuery = `UPDATE users SET name = ?, icNumber = ?, email = ?, phone = ?, salutation = ?`;
    const params = [name, icNumber, email, phone, salutation || 'En.'];

    if (password && password.trim() !== '') {
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and contain both letters and numbers.' });
      }
      updateQuery += `, password = ?`;
      params.push(password);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    await db.query(updateQuery, params);

    const [updatedUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Staff member details updated successfully.', user: updatedUser[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Update Staff Profile (Change password and bank details)
app.put('/api/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword, bankName, bankAccount, bankHolder, salutation } = req.body;

  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let passwordToUpdate = user.password;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
      }
      if (user.password !== currentPassword) {
        return res.status(400).json({ success: false, message: 'Incorrect current password.' });
      }
      if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters and contain both letters and numbers.' });
      }
      passwordToUpdate = newPassword;
    }

    await db.query(`
      UPDATE users 
      SET password = ?, bankName = ?, bankAccount = ?, bankHolder = ?, salutation = ?
      WHERE id = ?
    `, [passwordToUpdate, bankName || null, bankAccount || null, bankHolder || null, salutation || 'En.', id]);

    const [updatedUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Profile details updated successfully.', user: updatedUser[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Toggle User Status (Admin)
app.put('/api/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'enabled', 'disabled', 'pending'

  try {
    const db = getDb();
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    const [updatedUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return res.json({ success: true, user: updatedUser[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete User (Admin)
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Staff member deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ----------------------------------------------------
// JOBS / TASKS ROUTES
// ----------------------------------------------------

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM jobs');
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Add Job (Admin)
app.post('/api/jobs', async (req, res) => {
  const { title, description, locationName, payRate, date, time, latitude, longitude } = req.body;
  if (!title || !locationName || !payRate || !date || !time) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const db = getDb();
    const id = 'job-' + Date.now();
    await db.query(`
      INSERT INTO jobs (id, title, description, locationName, payRate, date, time, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, title, description || null, locationName, parseFloat(payRate), date, time, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null]);

    const [newJob] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    return res.json({ success: true, message: `Project task "${title}" added successfully.`, job: newJob[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Delete Job (Admin)
app.delete('/api/jobs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    await db.query('DELETE FROM jobs WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Project task deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update Job (Admin)
app.put('/api/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, locationName, payRate, date, time, latitude, longitude } = req.body;
  if (!title || !locationName || !payRate || !date || !time) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const db = getDb();
    await db.query(`
      UPDATE jobs 
      SET title = ?, description = ?, locationName = ?, payRate = ?, date = ?, time = ?, latitude = ?, longitude = ?
      WHERE id = ?
    `, [title, description || null, locationName, parseFloat(payRate), date, time, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null, id]);

    const [updatedJob] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (updatedJob.length === 0) {
      return res.status(404).json({ success: false, message: 'Project task not found.' });
    }
    return res.json({ success: true, message: `Project task "${title}" updated successfully.`, job: updatedJob[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ----------------------------------------------------
// SHIFTS / CLAIMS ROUTES
// ----------------------------------------------------

// Get all shifts
app.get('/api/shifts', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM shifts ORDER BY clockInTime DESC');
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Clear all shifts (Admin)
app.delete('/api/shifts', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DELETE FROM shifts');
    return res.json({ success: true, message: 'All shift monitoring records cleared.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Clock-in Job
app.post('/api/shifts/clockin', async (req, res) => {
  const { jobId, distance, workerId, workerName, customTime } = req.body;
  if (!jobId || distance === undefined || !workerId || !workerName) {
    return res.status(400).json({ error: 'Missing clock-in data.' });
  }

  try {
    const db = getDb();
    const [existingActiveShifts] = await db.query(
      'SELECT * FROM shifts WHERE workerId = ? AND status = "active"',
      [workerId]
    );
    if (existingActiveShifts.length > 0) {
      return res.status(400).json({ error: 'You are already clocked in to another project site. Please clock out first.' });
    }

    const [jobRows] = await db.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
    const job = jobRows[0];
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const id = 'shift-' + Date.now();
    const clockInTime = customTime || new Date().toISOString();

    await db.query(`
      INSERT INTO shifts (id, jobId, jobTitle, locationName, payRate, workerId, workerName, status, clockInTime, clockInDistance)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `, [id, jobId, job.title, job.locationName, job.payRate, workerId, workerName, clockInTime, parseFloat(distance)]);

    const [newShift] = await db.query('SELECT * FROM shifts WHERE id = ?', [id]);
    return res.json({ success: true, shift: newShift[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Clock-out Job
app.post('/api/shifts/clockout', async (req, res) => {
  const { jobId, workerId, distance, simulatedDurationMinutes, customTime } = req.body;
  if (!jobId || !workerId || distance === undefined) {
    return res.status(400).json({ error: 'Missing clock-out data.' });
  }

  try {
    const db = getDb();
    const [activeShifts] = await db.query(
      'SELECT * FROM shifts WHERE jobId = ? AND workerId = ? AND status = "active"',
      [jobId, workerId]
    );

    const shift = activeShifts[0];
    if (!shift) {
      return res.status(404).json({ error: 'Active shift not found.' });
    }

    let clockOutTime = customTime || new Date().toISOString();
    let durationMinutes = 0;

    if (simulatedDurationMinutes !== null && simulatedDurationMinutes !== undefined && !isNaN(simulatedDurationMinutes)) {
      durationMinutes = parseInt(simulatedDurationMinutes, 10);
      const clockInDate = new Date(shift.clockInTime);
      const clockOutDate = new Date(clockInDate.getTime() + durationMinutes * 60 * 1000);
      clockOutTime = clockOutDate.toISOString();
    } else {
      const clockInDate = new Date(shift.clockInTime);
      const clockOutDate = customTime ? new Date(customTime) : new Date();
      const diffMs = clockOutDate - clockInDate;
      durationMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)));
    }

    // Get work date string (YYYY-MM-DD) from clock-in time
    const dateStr = shift.clockInTime.substring(0, 10);

    // Find or create daily claim
    let claimId = `claim-${workerId}-${dateStr}`;
    const [existingClaims] = await db.query(
      'SELECT * FROM claims WHERE workerId = ? AND date = ?',
      [workerId, dateStr]
    );

    if (existingClaims.length === 0) {
      await db.query(`
        INSERT INTO claims (id, workerId, workerName, date, payRate, payout, status)
        VALUES (?, ?, ?, ?, 100.00, 100.00, 'pending')
      `, [claimId, workerId, shift.workerName, dateStr]);
    } else {
      claimId = existingClaims[0].id;
    }

    await db.query(`
      UPDATE shifts 
      SET status = 'completed', clockOutTime = ?, clockOutDistance = ?, durationMinutes = ?, claimId = ?
      WHERE id = ?
    `, [clockOutTime, parseFloat(distance), durationMinutes, claimId, shift.id]);

    const [updatedShift] = await db.query('SELECT * FROM shifts WHERE id = ?', [shift.id]);
    return res.json({ success: true, shift: updatedShift[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get all claims
app.get('/api/claims', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT * FROM claims ORDER BY date DESC');
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update claim
app.put('/api/claims/:id', async (req, res) => {
  const { id } = req.params;
  const { payRate, payout, status } = req.body;

  try {
    const db = getDb();
    const [existing] = await db.query('SELECT * FROM claims WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Claim not found.' });
    }
    const currentClaim = existing[0];

    const finalPayRate = payRate !== undefined ? parseFloat(payRate) : parseFloat(currentClaim.payRate);
    const finalPayout = payout !== undefined ? parseFloat(payout) : parseFloat(currentClaim.payout);
    const finalStatus = status !== undefined ? status : currentClaim.status;

    await db.query(`
      UPDATE claims 
      SET payRate = ?, payout = ?, status = ?
      WHERE id = ?
    `, [
      isNaN(finalPayRate) ? 100.00 : finalPayRate,
      isNaN(finalPayout) ? 100.00 : finalPayout,
      finalStatus,
      id
    ]);

    const [updatedClaim] = await db.query('SELECT * FROM claims WHERE id = ?', [id]);
    return res.json({ success: true, claim: updatedClaim[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ----------------------------------------------------
// UTILITY / SYSTEM ROUTES
// ----------------------------------------------------

// Reset Database
app.post('/api/reset', async (req, res) => {
  try {
    const db = getDb();
    await db.query('DROP TABLE IF EXISTS shifts');
    await db.query('DROP TABLE IF EXISTS claims');
    await db.query('DROP TABLE IF EXISTS jobs');
    await db.query('DROP TABLE IF EXISTS users');
    
    // Re-initialize database
    await initializeDatabase();
    
    return res.json({ success: true, message: 'Database reset to default settings.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to reset database.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Serve static assets from built client application
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback for Single Page Application (SPA) routing
app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ----------------------------------------------------
// SERVER STARTUP
// ----------------------------------------------------
async function startServer() {
  try {
    console.log('Initializing database connection...');
    await initializeDatabase();
    console.log('Database successfully initialized.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
