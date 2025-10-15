// ~/server/routes/wiki.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route   GET /api/wiki/ships
 * @desc    모든 함선 마스터(도감) 데이터를 조회합니다.
 * @access  Public
 */
router.get('/ships', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM ship_master ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

module.exports = router;