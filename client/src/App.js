// ~/client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider, useGameContext } from './contexts/GameContext';
import HomePort from './components/HomePort';
import ShipDex from './components/wiki/ShipDex';
import Header from './components/Header';
import MainMenu from './components/MainMenu';
import Factory from './components/Factory';
import Formation from './components/Formation';
import Sortie from './pages/Sortie';
import './App.css';

function AppContent() {
    const { isAuthenticated, loading, player } = useGameContext();

    if (loading) {
        return <div className="login-container"><h1>Loading...</h1></div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="login-container">
                <h2>Fleet Collection</h2>
                <a className="login-button" href={`${process.env.REACT_APP_API_URL}/auth/google`}>
                    <img src="/google-logo.svg" alt="Google G" />
                    <span>Google 계정으로 시작하기</span>
                </a>
            </div>
        );
    }
    
    // 로그인 후 플레이어 정보가 아직 로딩 중일 수 있음
    if (!player) {
         return <div className="login-container"><h1>지휘관 정보 로딩 중...</h1></div>;
    }

    return (
        <div className="App">
            <Header />
            <main className="main-content">
                {/* 좌측 메인 메뉴는 항상 표시됩니다. */}
                <div className="main-menu-panel">
                    <MainMenu />
                </div>
                <div className="panel-container">
                    <Routes>
                        <Route path="/" element={<HomePort />} />
                        <Route path="/wiki/ships" element={<ShipDex />} />
                        <Route path="/factory" element={<Factory />} />
                        <Route path="/formation" element={<Formation />} />
                        <Route path="/sortie" element={<Sortie />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <GameProvider>
                <AppContent />
            </GameProvider>
        </Router>
    );
}
export default App;