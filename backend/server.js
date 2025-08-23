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
    const { username, pwdPreHash } = req.body || {};
    if (!username || !pwdPreHash) {
      return res.status(400).json({ message: 'username, pwdPreHash 필요' });
    }
    if (users.has(username)) {
      return res.status(409).json({ message: '이미 존재하는 사용자' });
    }

    const serverHash = await argon2.hash(pwdPreHash, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    users.set(username, { serverHash });
    return res.status(201).json({ message: '등록 완료' });
  } catch (err) {
    console.error('Register Error:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// --- 2. 로그인 라우트 ---
app.post('/api/login', async (req, res) => {
  console.log('POST /api/login body:', req.body);
  try {
    const { username, pwdPreHash } = req.body || {};

    if (!username || !pwdPreHash) {
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

    const ok = await argon2.verify(storedHash, pwdPreHash);

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