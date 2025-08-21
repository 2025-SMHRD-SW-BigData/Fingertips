const pool = require('../config/database').promise();

const testDBConnection = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM users;');
    return { success: true, message: 'DB 연결 성공', result: rows[0] };
  } catch (error) {
    console.error('DB 연결 오류:', error);
    throw new Error('DB 연결 실패');
  }
};

module.exports = {
  testDBConnection,
};
