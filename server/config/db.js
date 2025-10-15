// ~/server/config/db.js
const { Pool } = require('pg');

/**
 * PostgreSQL 연결 풀을 생성하고 export합니다.
 * 애플리케이션 전체에서 이 풀을 공유하여 데이터베이스 연결을 관리합니다.
 * .env 파일에 설정된 환경 변수를 사용하여 연결 정보를 구성합니다.
 */
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;