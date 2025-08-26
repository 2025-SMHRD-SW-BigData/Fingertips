require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');

const app = express();

const corsOptions = {
  // .env 파일 등을 활용하여 프로덕션 환경에서는 실제 도메인을 사용하도록 설정하는 것이 좋다.
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));

// 라우트 연결
app.use('/api', authRoutes); // '/api/register', '/api/login' 등
app.use('/health', healthRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API 서버 시작: http://localhost:${PORT}`));

module.exports = app;