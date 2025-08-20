// .env 파일의 환경 변수를 로드합니다.

const mysql = require('mysql2');

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST, //DB호스트
  user: process.env.DB_USER,  //DB 사용자
  password: process.env.DB_PW,  //DB 비밀번호
  port: process.env.DB_PORT,  //DB 포트
  database: process.env.DB_DATABASE, //DB 이름
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 생성된 풀을 모듈로 내보냅니다.
module.exports = pool;