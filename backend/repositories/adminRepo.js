const { pool } = require('../db');

async function findAdminById(adminId) {
  const [rows] = await pool.query(
    'SELECT admin_id, hashed_password FROM tb_admin WHERE admin_id = ? LIMIT 1',
    [adminId]
  );
  return rows[0] || null;
}

module.exports = { findAdminById };

