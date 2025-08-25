require('dotenv').config();
const express = require('express');
const cors = require('cors');
const argon2 = require('argon2');
const dbPool = require('./config/database');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. 회원가입 라우트 ---
app.post('/api/register', async (req, res) => {
  try {
    // 1. 프론트엔드가 보내는 모든 필드를 받도록 수정
    const { admin_id, password, name, phone, email } = req.body || {};

    // 2. 유효성 검사: 원본 비밀번호(password)를 받는다
    if (!admin_id || !password || !name || !email) {
      return res.status(400).json({ message: '필수 정보(id, password, name, email)가 필요합니다.' });
    }

    // 3. DB에서 사용자 중복 확인 (실제 컬럼명 사용)
    const [rows] = await dbPool.query('SELECT admin_id FROM tb_admin WHERE admin_id = ?', [admin_id]);
    if (rows.length > 0) {
      return res.status(409).json({ message: '이미 존재하는 사용자 ID입니다.' });
    }

    // 4. 원본 비밀번호(password)를 서버에서 직접 해싱한다! 이게 핵심!
    const serverHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // 5. 모든 정보를 DB에 저장
    await dbPool.query(
      'INSERT INTO tb_admin (admin_id, hashed_password, name, phone, email, role, joined_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [admin_id, serverHash, name, phone, email, 'admin'] // role은 기본값으로 설정
    );

    return res.status(201).json({ message: '등록이 완료되었습니다.' });
  } catch (err) {
    console.error('Register Error:', err);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// --- 2. 로그인 라우트 ---
app.post('/api/login', async (req, res) => {
  // console.log('POST /api/login body:', req.body);
  try {
    const { username, password } = req.body || {};

    if (!username || !password ) {
    return res.status(400).json({ message: 'username, pwdPreHash 필요' });
    }

    const [rows] = await dbPool.query(
    'SELECT hashed_password FROM tb_admin WHERE admin_id = ?', // 실제 테이블/컬럼명
    [username]
);

if (rows.length === 0) {
  // 유저가 존재하지 않으면
  return res.status(401).json({ message: '자격 증명 오류' });
}

const user = rows[0]; // { server_hash: '...' }
// 2. DB에서 가져온 해시(user.server_hash)와 유저가 보낸 해시(pwdPreHash)를 비교한다.
const storedHash = user.hashed_password;

// 3. (방어 코드) DB에서 가져온 해시가 유효한지 확인한다.
    if (!storedHash) {
      console.error(`User '${username}' has no password hash in DB.`);
      return res.status(500).json({ message: '서버 내부 오류' });
    }

    const ok = await argon2.verify(storedHash, password );

if (!ok) {
    return res.status(401).json({ message: '자격 증명 오류' });
}

    // 실제 서비스에서는 여기서 세션/토큰(JWT 등)을 발급해야 한다.
    return res.json({ message: '로그인 성공' });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// require('./auth') 안에 다른 라우트가 있다면 이 부분은 유지해도 좋다.
// const { registerAuthRoutes } = require('./auth');
// registerAuthRoutes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API 서버 시작: http://localhost:${PORT}`));