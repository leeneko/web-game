// ~/web-game/server/routes/fleets.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated, getPlayerId } = require('../utils/middleware');

// GET /api/fleets
router.get('/', isAuthenticated, getPlayerId, async (req, res) => {
  try {
    const playerId = req.playerId;
    const query = `
      SELECT 
        pf.fleet_no, pf.name,
        (SELECT json_build_object('instance', s, 'master', sm) FROM ships s JOIN ship_master sm ON s.master_id = sm.id WHERE s.id = pf.ship_1) as ship_1,
        (SELECT json_build_object('instance', s, 'master', sm) FROM ships s JOIN ship_master sm ON s.master_id = sm.id WHERE s.id = pf.ship_2) as ship_2,
        (SELECT json_build_object('instance', s, 'master', sm) FROM ships s JOIN ship_master sm ON s.master_id = sm.id WHERE s.id = pf.ship_3) as ship_3,
        (SELECT json_build_object('instance', s, 'master', sm) FROM ships s JOIN ship_master sm ON s.master_id = sm.id WHERE s.id = pf.ship_4) as ship_4,
        (SELECT json_build_object('instance', s, 'master', sm) FROM ships s JOIN ship_master sm ON s.master_id = sm.id WHERE s.id = pf.ship_5) as ship_5,
        (SELECT json_build_object('instance', s, 'master', sm) FROM ships s JOIN ship_master sm ON s.master_id = sm.id WHERE s.id = pf.ship_6) as ship_6
      FROM player_fleets pf
      WHERE pf.player_id = $1 ORDER BY pf.fleet_no;
    `;
    
    const { rows } = await pool.query(query, [playerId]);
    res.json(rows);
  } catch (err) {
    console.error(`Error on GET /api/fleets:`, err.message);
    res.status(500).send('Server error');
  }
});

// PUT /api/fleets/:fleetNo
router.put('/:fleetNo', isAuthenticated, getPlayerId, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const playerId = req.playerId;
        const fleetNo = parseInt(req.params.fleetNo, 10);
        const { ships: shipIdsToUpdate } = req.body;

        if (isNaN(fleetNo) || fleetNo < 1 || fleetNo > 4) {
            return res.status(400).json({ msg: 'Invalid fleet number.' });
        }
        if (!Array.isArray(shipIdsToUpdate) || shipIdsToUpdate.length !== 6) {
            return res.status(400).json({ msg: 'Invalid ships data format.' });
        }
        
        const nonNullShipIds = shipIdsToUpdate.filter(id => id !== null);
        if (nonNullShipIds.length > 0) {
            const validationQuery = 'SELECT id FROM ships WHERE id = ANY($1::int[]) AND player_id = $2';
            const { rows: validShips } = await client.query(validationQuery, [nonNullShipIds, playerId]);
            
            if (validShips.length !== nonNullShipIds.length) {
                await client.query('ROLLBACK');
                return res.status(403).json({ msg: 'Attempted to assign an invalid or unauthorized ship.' });
            }
        }
        
        const [ship1, ship2, ship3, ship4, ship5, ship6] = shipIdsToUpdate;
        const updateQuery = `
            UPDATE player_fleets SET ship_1 = $1, ship_2 = $2, ship_3 = $3, ship_4 = $4, ship_5 = $5, ship_6 = $6, updated_at = NOW()
            WHERE player_id = $7 AND fleet_no = $8 RETURNING *`;
        const { rows: [updatedFleet] } = await client.query(updateQuery, [ship1, ship2, ship3, ship4, ship5, ship6, playerId, fleetNo]);

        if (!updatedFleet) { throw new Error('Fleet not found or no changes made.'); }

        await client.query('COMMIT');
        res.json(updatedFleet);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error on PUT /api/fleets/${req.params.fleetNo}:`, err.message);
        res.status(500).send('Server error');
    } finally {
        client.release();
    }
});

module.exports = router;