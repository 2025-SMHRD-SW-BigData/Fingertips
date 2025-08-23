const { query } = require('./db');

const testDBConnection = async () => {
  try {
    const rows = await query('SELECT * FROM users LIMIT 1;');
    return { success: true, message: 'DB 연결 성공', result: rows[0] || null };
  } catch (error) {
    console.error('DB 연결 오류:', error);
    throw new Error('DB 연결 실패');
  }
};

module.exports = {
  testDBConnection,
};

