// ~/web-game/server/index.js

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

const pool = require('./config/db');
const configurePassport = require('./config/passport');
const { isAuthenticated } = require('./utils/middleware');

// --- CHECKPOINT 1: CORS ---
app.use((req, res, next) => {
    console.log(`[CHECKPOINT 0] Request received: ${req.method} ${req.originalUrl}`);
    next();
});
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// --- CHECKPOINT 2: Morgan Logger ---
app.use((req, res, next) => {
    console.log('[CHECKPOINT 1] After CORS');
    next();
});
app.use(morgan('dev'));

// --- CHECKPOINT 3: Body Parsers ---
app.use((req, res, next) => {
    console.log('[CHECKPOINT 2] After Morgan');
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CHECKPOINT 4: Session ---
app.use((req, res, next) => {
    console.log('[CHECKPOINT 3] After Body Parsers');
    next();
});
app.use(session({
    store: new pgSession({ pool, tableName: 'user_sessions' }),
    secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
}));

// --- CHECKPOINT 5: Passport ---
app.use((req, res, next) => {
    console.log('[CHECKPOINT 4] After Session');
    next();
});
configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// --- CHECKPOINT 6: Before Routers ---
app.use((req, res, next) => {
    console.log('[CHECKPOINT 5] After Passport');
    next();
});

// --- 라우트 설정 ---
const authRoutes = require('./routes/auth');
const gameDataRoutes = require('./routes/gameData');
const wikiRoutes = require('./routes/wiki');
const factoryRoutes = require('./routes/factory');
const fleetsRoutes = require('./routes/fleets');
const shipsRoutes = require('./routes/ships');
const sortieRoutes = require('./routes/sortie');

app.use('/auth', authRoutes);
app.use('/api/game-data', isAuthenticated, gameDataRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/factory', isAuthenticated, factoryRoutes);
app.use('/api/fleets', fleetsRoutes);
app.use('/api/ships', shipsRoutes);
app.use('/api/sortie', isAuthenticated, sortieRoutes);

// --- 중앙 에러 핸들러 ---
app.use((err, req, res, next) => {
    console.error(`[ERROR] at ${req.method} ${req.originalUrl}\n`, err.stack);
    res.status(500).json({ message: err.message || '서버 내부 오류가 발생했습니다.' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});