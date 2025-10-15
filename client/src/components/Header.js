// ~/client/src/components/Header.js
import React from 'react';
import { useGameContext } from '../contexts/GameContext';
import api from '../api';

export default function Header() {
    const { player } = useGameContext();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            window.location.reload();
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    if (!player) return null;

    return (
        <header className="top-toolbar">
            <div className="commander-info">
                <span>{player.commander_name}</span>
                <span>Lv.{player.commander_level}</span>
                <span>({player.rank})</span>
            </div>
            <div className="resource-display">
                <span>연료: {player.fuel}</span>
                <span>탄약: {player.ammo}</span>
                <span>강재: {player.steel}</span>
                <span>보크사이트: {player.bauxite}</span>
            </div>
            <button className="action-logout" onClick={handleLogout}>로그아웃</button>
        </header>
    );
}