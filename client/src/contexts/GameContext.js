// ~/client/src/contexts/GameContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api'; 

const GameContext = createContext();

export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [player, setPlayer] = useState(null);
    const [playerShips, setPlayerShips] = useState([]); 
    const [shipMasterData, setShipMasterData] = useState([]);
    const [docks, setDocks] = useState([]); // docks 상태 추가

    const fetchInitialData = useCallback(async () => {
        try {
            const userRes = await api.get('/auth/user'); 
            if (userRes.data) {
                setIsAuthenticated(true);
                
                const [gameDataRes, masterDataRes, docksRes] = await Promise.all([
                    api.get('/api/game-data/player'),
                    api.get('/wiki/ships'),
                    api.get('/api/factory/docks')
                ]);

                if (gameDataRes.data) {
                    setPlayer(gameDataRes.data.player);
                    setPlayerShips(gameDataRes.data.ships || []); 
                }
                
                if (Array.isArray(masterDataRes.data)) {
                    setShipMasterData(masterDataRes.data);
                } else {
                    setShipMasterData([]);
                }

                let serverDocks = docksRes.data;
                if (!Array.isArray(serverDocks)) serverDocks = [];
                const baseDocks = [ { dock_number: 1 }, { dock_number: 2 }, { dock_number: 3 }, { dock_number: 4 } ];
                const mergedDocks = baseDocks.map(base => serverDocks.find(d => d.dock_number === base.dock_number) || base);
                setDocks(mergedDocks);

            }
        } catch (error) {
            if (error.response && error.response.status !== 401) {
                console.error("Failed to fetch initial data:", error);
            }
            setIsAuthenticated(false);
            setPlayer(null);
            setPlayerShips([]);
            setShipMasterData([]);
            setDocks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const value = {
        isAuthenticated,
        loading,
        player,
        ships: playerShips, 
        playerShips,
        shipMasterData,
        docks,
        refreshData: fetchInitialData 
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};