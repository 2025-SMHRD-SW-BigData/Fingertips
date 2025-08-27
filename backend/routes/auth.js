const express = require('express');
const argon2 = require('argon2');
const dbPool = require('../config/database');

const router = express.Router();

// 1) 회원가입
router.post('/register', async (req, res) => {
  try {
    const { admin_id, password, name, phone, email } = req.body || {};
    if (!admin_id || !password || !name || !email) {
      return res.status(400).json({ message: '필수 정보(id, password, name, email)가 필요합니다.' });
    }

    const [rows] = await dbPool.query('SELECT admin_id FROM tb_admin WHERE admin_id = ?', [admin_id]);
    if (rows.length > 0) {
      return res.status(409).json({ message: '이미 존재하는 사용자 ID입니다.' });
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await dbPool.query(
      'INSERT INTO tb_admin (admin_id, hashed_password, name, phone, email, role, joined_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [admin_id, passwordHash, name, phone || '', email, 'admin']
    );

    return res.status(201).json({ message: '등록이 완료되었습니다.' });
  } catch (err) {
    console.error('Register Error:', err);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 2) 로그인 (토큰 발급 없이 성공 응답)
router.post('/login', async (req, res) => {
  try {
    const { admin_id, password } = req.body || {};
    if (!admin_id || !password) {
      return res.status(400).json({ message: 'admin_id, password 필요' });
    }

    const [rows] = await dbPool.query(
      'SELECT admin_id, name, role, hashed_password FROM tb_admin WHERE admin_id = ? LIMIT 1',
      [admin_id]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: '자격 증명 오류' });
    }

    const user = rows[0];
    const ok = await argon2.verify(user.hashed_password, password);
    if (!ok) {
      return res.status(401).json({ message: '자격 증명 오류' });
    }

    // 세션/토큰 없이 클라이언트가 필요로 하는 최소 정보만 반환
    return res.status(200).json({ message: '로그인 성공', adminName: user.name, admin_id: user.admin_id, role: user.role || 'admin' });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
// 경량 버전 내 정보 조회 (JWT 없이 admin_id 전달)
router.get('/me', async (req, res) => {
  try {
    const adminId = (req.query.admin_id || req.headers['x-admin-id'] || '').toString().trim();
    if (!adminId) {
      return res.status(400).json({ message: 'admin_id가 필요합니다.' });
    }
    const [rows] = await dbPool.query(
      'SELECT admin_id, name, role FROM tb_admin WHERE admin_id = ? LIMIT 1',
      [adminId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: '관리자를 찾을 수 없습니다.' });
    }
    const { admin_id, name, role } = rows[0];
    return res.status(200).json({ admin_id, name, role });
  } catch (err) {
    console.error('Me Error:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
});
