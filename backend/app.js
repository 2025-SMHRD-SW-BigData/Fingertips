require('dotenv').config();
const express = require('express');
const app = express();
const testRoutes = require('./routes/test');
const PORT = process.env.PORT

// 미들웨어 (예: JSON 파싱)
app.use(express.json());


// 라우터 등록
app.use('/test',testRoutes);

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});