// ~/web-game/server/config/passport.js
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const pool = require('./db');

module.exports = function(passport) {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            if (result.rows.length > 0) {
                return done(null, result.rows[0]);
            }
            return done(new Error('User not found'));
        } catch (err) {
            return done(err);
        }
    });

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
        const { id, displayName, emails } = profile;
        const email = emails?.[0]?.value;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            let userResult = await client.query('SELECT * FROM users WHERE google_id = $1', [id]);
            let user;

            if (userResult.rows.length > 0) {
                user = userResult.rows[0];
            } else {
                const newUserResult = await client.query(
                    'INSERT INTO users (google_id, display_name, email) VALUES ($1, $2, $3) RETURNING *',
                    [id, displayName, email]
                );
                user = newUserResult.rows[0];
            }

            // players 테이블에 정보가 있는지 확인하고, 없으면 '모든 초기 정보' 생성
            let playerResult = await client.query('SELECT * FROM players WHERE user_id = $1', [user.id]);
            if (playerResult.rows.length === 0) {
                // 1. 신규 지휘관 정보 생성
                const newPlayerResult = await client.query(
                    'INSERT INTO players (user_id, commander_name) VALUES ($1, $2) RETURNING *',
                    [user.id, user.display_name]
                );
                const newPlayer = newPlayerResult.rows[0];

                // 2. 기본 건조 독 4개 자동 생성
                await client.query(
                    `INSERT INTO construction_docks (player_id, dock_number) VALUES ($1, 1), ($1, 2), ($1, 3), ($1, 4)`,
                    [newPlayer.id]
                );
                
                // 3. 기본 함대 4개 자동 생성
                await client.query(
                    `INSERT INTO player_fleets (player_id, fleet_no, name) VALUES ($1, 1, '제1함대'), ($1, 2, '제2함대'), ($1, 3, '제3함대'), ($1, 4, '제4함대')`,
                    [newPlayer.id]
                );
            }
            
            await client.query('COMMIT');
            return done(null, user);
        } catch (err) {
            await client.query('ROLLBACK');
            return done(err);
        } finally {
            client.release();
        }
    }));
};