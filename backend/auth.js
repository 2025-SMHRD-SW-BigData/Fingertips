const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { findAdminById } = require('./repositories/adminRepo');

function registerAuthRoutes(app) {
  app.post('/api/login', async (req, res) => {
    try {
      const { username, pwdPreHash } = req.body || {};
      if (!username || !pwdPreHash) {
        return res.status(400).json({ message: 'username, pwdPreHash 필요' });
      }

      const admin = await findAdminById(username);
      if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

      // tb_admin.hashed_password에는 회원가입 시 서버에서 argon2.hash(pwdPreHash) 결과가 저장되어 있어야 함
      const ok = await argon2.verify(admin.hashed_password, pwdPreHash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        { sub: admin.admin_id, role: 'admin' },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '1h' }
      );

      res.json({ token });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
}

module.exports = { registerAuthRoutes };

