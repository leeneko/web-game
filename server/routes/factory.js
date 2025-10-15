// ~/server/routes/factory.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { getPlayerId } = require('../utils/middleware');

/**
 * @route   GET /api/factory/docks
 * @desc    현재 지휘관의 모든 건조 독 상태를 조회합니다.
 * @access  Private
 */
router.get('/docks', getPlayerId, async (req, res, next) => {
    try {
        const docksRes = await pool.query(
            // s.ship_name을 함께 조회하여 건조 완료 시 함선 이름을 알 수 있도록 함
            `SELECT cd.*, sm.ship_name 
             FROM construction_docks cd
             LEFT JOIN ship_master sm ON cd.ship_master_id = sm.id
             WHERE cd.player_id = $1 ORDER BY cd.dock_number ASC`,
            [req.playerId]
        );
        res.json(docksRes.rows);
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/factory/build
 * @desc    함선 건조를 시작합니다.
 * @body    { dock_number, fuel, ammo, steel, bauxite }
 * @access  Private
 */
router.post('/build', getPlayerId, async (req, res, next) => {
    const { dock_number, fuel, ammo, steel, bauxite } = req.body;
    const playerId = req.playerId;

    if (![1, 2, 3, 4].includes(dock_number)) {
        return res.status(400).json({ message: '유효하지 않은 건조 독입니다.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const playerRes = await client.query("SELECT * FROM players WHERE id = $1 FOR UPDATE", [playerId]);
        const player = playerRes.rows[0];
        const shipCountRes = await client.query("SELECT COUNT(*) AS count FROM ships WHERE player_id = $1", [playerId]);
        const currentShipCount = parseInt(shipCountRes.rows[0].count, 10);
        
        const buildingDocksRes = await client.query("SELECT COUNT(*) FROM construction_docks WHERE player_id = $1 AND ship_master_id IS NOT NULL", [playerId]);
        const isBuilding = parseInt(buildingDocksRes.rows[0].count, 10) > 0;
        if (currentShipCount < 4 && isBuilding) {
            return res.status(400).json({ message: "튜토리얼 건조가 진행 중입니다. 완료 후 다음 건조를 시작해주세요."});
        }

        let builtShipMaster;
        let buildTimeMinutes;

        if (currentShipCount < 4) {
            const tutorialStep = currentShipCount + 1;
            const tutorialData = {
                1: { req: { f: 30, a: 30, s: 30, b: 30 }, shipId: 1 },
                2: { req: { f: 30, a: 30, s: 30, b: 30 }, shipId: 2 },
                3: { req: { f: 30, a: 30, s: 30, b: 30 }, shipId: 3 },
                4: { req: { f: 200, a: 30, s: 250, b: 30 }, shipId: 5 },
            };
            const currentTutorial = tutorialData[tutorialStep];
            if (!currentTutorial) throw new Error("튜토리얼 데이터 오류");
            if (fuel !== currentTutorial.req.f || ammo !== currentTutorial.req.a || steel !== currentTutorial.req.s || bauxite !== currentTutorial.req.b) {
                throw new Error(`튜토리얼 건조: 자원을 정확히 맞춰주세요.`);
            }
            
            const shipMasterRes = await client.query("SELECT * FROM ship_master WHERE id = $1", [currentTutorial.shipId]);
            builtShipMaster = shipMasterRes.rows[0];

            if (tutorialStep <= 3) {
                buildTimeMinutes = 1;
            } else {
                buildTimeMinutes = builtShipMaster.build_time_minutes;
            }
        } else {
            const shipMasterRes = await client.query("SELECT * FROM ship_master ORDER BY RANDOM() LIMIT 1");
            builtShipMaster = shipMasterRes.rows[0];
            buildTimeMinutes = builtShipMaster.build_time_minutes;
        }

        // 자원 차감 로직
        if (player.fuel < fuel || player.ammo < ammo || player.steel < steel || player.bauxite < bauxite) {
            throw new Error("자원이 부족합니다.");
        }
        await client.query(
            `UPDATE players SET fuel = fuel - $1, ammo = ammo - $2, steel = steel - $3, bauxite = bauxite - $4 WHERE id = $5`,
            [fuel, ammo, steel, bauxite, playerId]
        );
        
        // 건조 독 상태 업데이트 로직
        await client.query(
            `UPDATE construction_docks 
             SET ship_master_id = $1, completion_time = NOW() + INTERVAL '${buildTimeMinutes} minutes' 
             WHERE player_id = $2 AND dock_number = $3 AND ship_master_id IS NULL`,
            [builtShipMaster.id, playerId, dock_number]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: `건조를 시작합니다! (완료까지 ${buildTimeMinutes}분)` });

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.message.includes("자원")) {
            return res.status(400).json({ message: err.message });
        }
        next(err);
    } finally {
        client.release();
    }
});

/**
 * @route   POST /api/factory/instant-complete
 * @desc    건조를 즉시 완료시킵니다.
 * @body    { dock_number, use_item: boolean }
 * @access  Private
 */
router.post('/instant-complete', getPlayerId, async (req, res, next) => {
    const { dock_number, use_item } = req.body;
    const playerId = req.playerId;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        const dockRes = await client.query("SELECT * FROM construction_docks WHERE player_id = $1 AND dock_number = $2 FOR UPDATE", [playerId, dock_number]);
        if (dockRes.rows.length === 0 || !dockRes.rows[0].completion_time) {
            throw new Error("건조 중인 독이 아닙니다.");
        }
        const dock = dockRes.rows[0];
        const timeLeft = new Date(dock.completion_time).getTime() - new Date().getTime();

        if (use_item) {
            // 고속건조재 사용
            const playerRes = await client.query("SELECT instant_build FROM players WHERE id = $1 FOR UPDATE", [playerId]);
            if (playerRes.rows[0].instant_build < 1) {
                throw new Error("고속건조재가 부족합니다.");
            }
            await client.query("UPDATE players SET instant_build = instant_build - 1 WHERE id = $1", [playerId]);
        } else {
            // 무료 즉시 완료 (1분 미만)
            if (timeLeft > 60000) { // 1분 = 60000ms
                throw new Error("1분 미만으로 남았을 때만 무료로 즉시 완료할 수 있습니다.");
            }
        }
        
        // 시간을 과거로 돌려 즉시 완료 처리
        await client.query("UPDATE construction_docks SET completion_time = NOW() - INTERVAL '1 second' WHERE id = $1", [dock.id]);

        await client.query('COMMIT');
        res.json({ message: "건조를 즉시 완료했습니다!" });
    } catch(err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

/**
 * @route   POST /api/factory/complete
 * @desc    완료된 건조를 수령하여 함선을 획득합니다.
 * @body    { dock_number }
 * @access  Private
 */
router.post('/complete', getPlayerId, async (req, res, next) => {
    const { dock_number } = req.body;
    const playerId = req.playerId;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. 완료된 건조 독 정보 확인
        const dockRes = await client.query(
            `SELECT * FROM construction_docks 
             WHERE player_id = $1 AND dock_number = $2 AND completion_time <= NOW() FOR UPDATE`,
            [playerId, dock_number]
        );
        if (dockRes.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: "완료되지 않았거나 유효하지 않은 건조입니다." });
        }
        const completedDock = dockRes.rows[0];
        const newShipMasterId = completedDock.ship_master_id;

        // 2. ship_master 테이블에서 함선 기본 정보 가져오기
        const shipMasterRes = await client.query("SELECT * FROM ship_master WHERE id = $1", [newShipMasterId]);
        if (shipMasterRes.rows.length === 0) {
            throw new Error(`Ship master data not found for id: ${newShipMasterId}`);
        }
        const shipMaster = shipMasterRes.rows[0];
        
        // 새로 건조된 함선의 기본 보급량 (향후 함종별로 세분화 가능)
        const INITIAL_FUEL = 10;
        const INITIAL_AMMO = 10;

        // 3. 새로운 함선을 ships 테이블에 추가
        await client.query(
            `INSERT INTO ships 
             (player_id, master_id, level, exp, current_hp, fuel, ammo)
             VALUES ($1, $2, 1, 0, $3, $4, $5)`,
            [
                playerId,             // $1: player_id
                newShipMasterId,      // $2: master_id
                shipMaster.hp_base,   // $3: current_hp
                INITIAL_FUEL,         // $4: fuel (기본값)
                INITIAL_AMMO          // $5: ammo (기본값)
            ]
        );

        // 4. 건조 독을 다시 비움
        await client.query(
            "UPDATE construction_docks SET ship_master_id = NULL, completion_time = NULL WHERE id = $1",
            [completedDock.id]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: `새로운 함선 [${shipMaster.ship_name}]이 함대에 합류했습니다!`, newShip: shipMaster });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

module.exports = router;