// ~/web-game/server/routes/sortie.js

const express = require('express');
const router = express.Router();
const db = require('../config/db'); // 데이터베이스 연결 풀
const { isAuthenticated } = require('../utils/middleware'); // 인증 미들웨어

// POST /api/sortie/start - 출격 시작
// isAuthenticated 미들웨어를 사용하여 로그인된 유저만 접근 가능하도록 설정
router.post('/start', isAuthenticated, async (req, res) => {
  // req.user.id 대신, passport가 세션에서 deserializeUser를 통해 넣어주는 req.user 객체 전체를 사용
  // players 테이블의 id가 req.user.id에 있다고 가정합니다.
  const playerId = req.user.id; 
  const { fleetNo, mapId } = req.body;

  // 1. 기본 요청 데이터 유효성 검사
  if (!fleetNo || !mapId) {
    return res.status(400).json({ msg: '함대 번호와 해역 ID가 필요합니다.' });
  }

  try {
    // 2. 출격 조건 검증 (함대 상태 체크)
    const fleetCheckQuery = `
      SELECT 
        s.id, s.current_hp, s.fuel, s.ammo, s.repair_time,
        sm.hp AS hp_max, sm.fuel AS fuel_max, sm.ammo AS ammo_max
      FROM ships s
      JOIN ship_master sm ON s.ship_master_id = sm.id
      WHERE s.player_id = $1 AND s.fleet_no = $2 AND s.is_locked = false
    `;
    const { rows: fleetShips } = await db.query(fleetCheckQuery, [playerId, fleetNo]);

    if (fleetShips.length === 0) {
      return res.status(400).json({ msg: '편성된 함선이 없는 함대입니다.' });
    }

    for (const ship of fleetShips) {
      // 대파(체력 25% 이하) 상태인 함선이 있는지 확인
      if ((ship.current_hp / ship.hp_max) <= 0.25) {
        return res.status(403).json({ msg: `함선(ID: ${ship.id})이 대파 상태이므로 출격할 수 없습니다.` });
      }
      // 수리 중인 함선이 있는지 확인
      if (ship.repair_time) {
        return res.status(403).json({ msg: `함선(ID: ${ship.id})이 수리 중이므로 출격할 수 없습니다.` });
      }
      // 보급이 필요한 함선이 있는지 확인 (연료 또는 탄약이 최대치가 아닐 경우)
      if (ship.fuel < ship.fuel_max || ship.ammo < ship.ammo_max) {
        return res.status(403).json({ msg: `함선(ID: ${ship.id})의 보급이 필요합니다.` });
      }
    }
    
    // 3. sortie_logs 테이블에 출격 기록 생성
    const insertSortieLogQuery = `
      INSERT INTO sortie_logs (player_id, fleet_no, map_id)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const { rows: newSortieLog } = await db.query(insertSortieLogQuery, [playerId, fleetNo, mapId]);
    const sortieLogId = newSortieLog[0].id;
    
    // 4. 성공 응답 반환
    res.status(201).json({ 
      msg: '출격을 시작합니다.',
      sortieLogId: sortieLogId 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;