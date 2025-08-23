const pool = require('../config/database');

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function withTransaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (err) {
    try { await connection.rollback(); } catch (_) {}
    throw err;
  } finally {
    connection.release();
  }
}

async function ping() {
  await pool.query('SELECT 1');
}

module.exports = {
  pool,
  query,
  withTransaction,
  ping,
};

