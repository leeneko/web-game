// ~/server/utils/middleware.js
const pool = require('../config/db');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: '인증이 필요합니다.' });
};

// [신규] user_id로부터 player_id를 조회하여 req.playerId에 추가
const getPlayerId = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: '인증 정보가 유효하지 않습니다.' });
    }
    try {
        const user_id = req.user.id;
        const playerRes = await pool.query('SELECT id FROM players WHERE user_id = $1', [user_id]);
        if (playerRes.rows.length === 0) {
            return res.status(404).json({ msg: 'Player not found for this user' });
        }
        req.playerId = playerRes.rows[0].id;
        next();
    } catch (err) { 
        console.error('Error fetching player ID:', err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { isAuthenticated, getPlayerId };