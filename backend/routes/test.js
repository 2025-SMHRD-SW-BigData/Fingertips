const express = require('express');
const router = express.Router();
const pool = require('../config/database').promise(); // DB 연결 정보 가져오기

// 데이터베이스 연결 테스트 라우트
router.get('/test-db', async (req, res) => {
  try {
    
    // 간단한 쿼리를 실행합니다.
    const [rows] = await pool.query('SELECT * FROM users;');
    
    res.json({ success: true, message: 'DB 연결 성공', result: rows[0] });
    console.log('DB연결성공')
  } catch (error) {
    console.error('DB 연결 오류:', error);
    res.status(500).json({ success: false, message: 'DB 연결 실패', error: error.message });
    console.log('DB연결실패')
  }
});

module.exports = router;
