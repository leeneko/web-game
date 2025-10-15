// ~/server/routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const { isAuthenticated } = require('../utils/middleware'); // isAuthenticated 임포트

// --- Google OAuth ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', {
    successRedirect: process.env.CLIENT_URL, // 성공 시 클라이언트 메인 페이지로
    failureRedirect: `${process.env.CLIENT_URL}/login-failure` // 실패 시
}));


// --- Session Management ---

/**
 * @route   GET /auth/user
 * @desc    현재 세션에 저장된 사용자 정보를 반환합니다. (로그인 상태 확인용)
 * @access  Public (실패 시 401이 자동으로 처리됨)
 */
router.get('/user', isAuthenticated, (req, res) => {
    // isAuthenticated 미들웨어를 통과했다는 것은 req.user가 존재함을 보장합니다.
    res.json(req.user);
});

/**
 * @route   POST /auth/logout
 * @desc    사용자를 로그아웃 처리하고 세션을 파기합니다.
 * @access  Private
 */
router.post('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: '로그아웃 중 세션 삭제에 실패했습니다.' });
            }
            res.clearCookie('connect.sid'); // 세션 쿠키 삭제
            res.status(200).json({ message: '성공적으로 로그아웃되었습니다.' });
        });
    });
});

module.exports = router;