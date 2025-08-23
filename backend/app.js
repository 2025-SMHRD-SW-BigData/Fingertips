// --- 환경 변수 로드 ---
// .env 파일의 환경 변수를 process.env에 로드합니다.
// 다른 모든 모듈보다 먼저 실행되어야 변수들이 정상적으로 적용됩니다.
require('dotenv').config();

// --- 모듈 임포트 ---
const express = require('express');
const dbPool = require('./config/database'); // 데이터베이스 커넥션 풀
const testRoutes = require('./routes/test');
const healthRoutes = require('./routes/health');

// --- 전역 상수 및 설정 ---
const app = express();
// 서버 포트 설정. .env 파일의 APP_PORT, PORT 값을 순서대로 사용하며, 둘 다 없으면 3000번을 기본값으로 사용합니다.
const PORT = parseInt(process.env.APP_PORT || process.env.PORT, 10) || 3000;

// --- 미들웨어 설정 ---
// Express에 내장된 body-parser를 사용하여 들어오는 요청의 JSON 본문을 파싱합니다.
// 이 미들웨어가 없으면 req.body는 undefined 상태가 됩니다.
app.use(express.json());

// --- 라우팅 설정 ---
// API 엔드포인트를 각 라우터 파일에 매핑합니다.
app.use('/test', testRoutes);       // 테스트용 라우트
app.use('/health', healthRoutes);   // 서버 상태 체크용 라우트 (로드 밸런서 등에서 사용)

// --- 서버 실행 및 초기화 ---
const server = app.listen(PORT, '0.0.0.0', () => {
  // '0.0.0.0'은 모든 네트워크 인터페이스에서 들어오는 연결을 허용합니다.
  // Docker 컨테이너 등 외부에서 접속해야 할 경우 필수적입니다.
  console.log(`Server running on http://localhost:${PORT}`);

  // 서버가 성공적으로 시작된 후, 데이터베이스 연결을 비동기적으로 확인합니다.
  // 즉시 실행 함수 표현(IIFE)을 사용하여 async/await 문법을 사용합니다.
  (async () => {
    try {
      console.log(`DB target => host: ${process.env.DB_HOST}, port: ${process.env.DB_PORT || 3306}, user: ${process.env.DB_USER}`);
      // 간단한 쿼리를 날려 DB가 실제로 응답하는지 확인합니다.
      await dbPool.query('SELECT 1');
      console.log('DB connection check: OK');
    } catch (err) {
      // DB 연결 실패는 심각한 문제이므로 에러를 명확히 출력합니다.
      // TODO: DB 연결 실패 시, 일정 시간 후 재시도하는 로직 추가 고려.
      console.error('DB connection check failed:', err.message);
    }
  })();
});

// --- 프로세스 종료 처리 ---
// 서버가 갑자기 죽지 않고, 하던 작업을 마무리하고 안전하게 종료되도록 처리합니다.
function shutdown(signal) {
  console.log(`\nReceived ${signal}. Closing server and DB pool...`);
  // 1. 새로운 요청을 더 이상 받지 않도록 서버를 닫습니다.
  server.close(async () => {
    try {
      // 2. 데이터베이스 커넥션 풀을 안전하게 종료합니다.
      await dbPool.end();
      console.log('DB pool closed. Bye!');
      // 3. 모든 작업이 완료되면 프로세스를 종료합니다.
      process.exit(0);
    } catch (e) {
      console.error('Error closing DB pool:', e.message);
      process.exit(1);
    }
  });
}

// Ctrl+C (터미널에서 인터럽트) 또는 kill 명령어에 반응하여 shutdown 함수를 호출합니다.
process.on('SIGINT', () => shutdown('SIGINT'));   // Interrupt Signal
process.on('SIGTERM', () => shutdown('SIGTERM')); // Terminate Signal

// --- 서버 에러 처리 ---
// 서버 실행 중 발생하는 주요 에러를 처리합니다.
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    // 포트가 이미 사용 중일 때 발생하는 에러
    console.error(`Port ${PORT} is already in use. Change APP_PORT or free the port.`);
  } else if (err && err.code === 'EACCES') {
    // 포트에 접근할 권한이 없을 때 (e.g., 1024 미만 포트를 일반 유저로 실행)
    console.error(`Insufficient privileges to bind port ${PORT}. Try another port.`);
  } else {
    // 그 외 예측하지 못한 서버 에러
    console.error('Server error:', err);
  }
  // 심각한 에러 발생 시 프로세스를 비정상 종료시켜 문제를 알립니다.
  process.exit(1);
});