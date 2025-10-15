const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { getPlayerId } = require('../utils/middleware');
const { calculateFinalShipStats } = require('../utils/gameLogic');

/**
 * @route   GET /api/ships/:shipId
 * @desc    특정 함선 한 척의 모든 상세 정보를 가져옵니다.
 * @access  Private (index.js에서 isAuthenticated가 적용될 것임)
 */
router.get('/:shipId', getPlayerId, async (req, res, next) => {
    const client = await pool.connect();
    try {
        const playerId = req.playerId;
        const shipId = parseInt(req.params.shipId, 10);

        if (isNaN(shipId)) {
            return res.status(400).json({ msg: 'Invalid ship ID.' });
        }

        // 1. 함선 기본 정보 및 마스터 정보 조회 (플레이어 소유권 확인 포함)
        const shipQuery = `
            SELECT s.*, row_to_json(sm.*) as ship_master
            FROM ships s
            JOIN ship_master sm ON s.master_id = sm.id
            WHERE s.id = $1 AND s.player_id = $2;
        `;
        const shipRes = await client.query(shipQuery, [shipId, playerId]);

        if (shipRes.rows.length === 0) {
            return res.status(404).json({ msg: 'Ship not found or not owned by player.' });
        }

        const shipInstance = shipRes.rows[0];
        const shipMaster = shipInstance.ship_master;

        // 2. 장착된 장비 정보 조회
        const slotColumns = [shipInstance.slot_1, shipInstance.slot_2, shipInstance.slot_3, shipInstance.slot_4, shipInstance.slot_5];
        const equipmentIds = slotColumns.filter(id => id !== null);
        
        let equippedItems = [];
        if (equipmentIds.length > 0) {
            const equipmentQuery = `
                SELECT pem.*, row_to_json(em.*) as equipment_master
                FROM player_equipment pem
                JOIN equipment_master em ON pem.equipment_master_id = em.id
                WHERE pem.id = ANY($1::int[]);
            `;
            const equipmentRes = await client.query(equipmentQuery, [equipmentIds]);
            equippedItems = equipmentRes.rows;
        }

        // 3. 최종 스탯 계산
        const finalStats = calculateFinalShipStats(shipMaster, shipInstance, equippedItems.map(item => item.equipment_master));

        // 4. 최종 데이터 조합하여 반환
        const responseData = {
            instance: shipInstance, // DB에 저장된 원본 데이터
            master: shipMaster,
            equippedItems: equippedItems, // 장착된 장비의 상세 정보
            finalStats: finalStats       // 최종 계산된 능력치
        };

        res.json(responseData);

    } catch (err) {
        next(err);
    } finally {
        client.release();
    }
});

module.exports = router;