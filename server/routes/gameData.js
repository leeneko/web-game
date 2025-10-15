// ~/server/routes/gameData.js (전체 코드)
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { getPlayerId } = require('../utils/middleware');

/**
 * @route   GET /api/game-data/player
 * @desc    현재 로그인한 지휘관의 모든 정보를 가져옵니다.
 * @access  Private
 */
router.get('/player', getPlayerId, async (req, res, next) => {
    try {
        const playerRes = await pool.query('SELECT * FROM players WHERE id = $1', [req.playerId]);
        
        // JOIN 조건의 컬럼명을 s.master_id 로 최종 수정
        const shipsQuery = `
            SELECT s.*, row_to_json(sm.*) as ship_master
            FROM ships s
            JOIN ship_master sm ON s.master_id = sm.id
            WHERE s.player_id = $1
            ORDER BY s.created_at;
        `;
        const shipsRes = await pool.query(shipsQuery, [req.playerId]);
        
        if (playerRes.rows.length === 0) {
            return res.status(404).json({ message: 'Player data not found.' });
        }

        res.json({
            player: playerRes.rows[0],
            ships: shipsRes.rows,
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;