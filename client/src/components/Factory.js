// ~/client/src/components/Factory.js

import React from 'react';
import api from '../api';
import { useGameContext } from '../contexts/GameContext';
import CountdownTimer from './CountdownTimer';
import './Factory.css';

// 기획 변경: 고정된 건조 레시피를 상수로 정의
const BUILD_TYPES = {
  small: { name: '소형함 건조', resources: { fuel: 100, ammo: 100, steel: 100, bauxite: 100 } },
  large: { name: '대형함 건조', resources: { fuel: 300, ammo: 300, steel: 300, bauxite: 300 } },
  special: { name: '특형함 건조', resources: { fuel: 500, ammo: 500, steel: 500, bauxite: 500 } },
};

const Dock = ({ dockData, onComplete, onInstantComplete }) => {
    const { shipMasterData, player } = useGameContext();

    const getStatus = () => {
        if (!dockData || !dockData.ship_master_id) return 'empty';
        if (new Date(dockData.completion_time) > new Date()) return 'building';
        return 'complete';
    };
    
    const status = getStatus();
    
    const playerLevel = player ? player.commander_level : 0;
    let isLocked = false;
    if (dockData.dock_number === 3 && playerLevel < 5) isLocked = true;
    if (dockData.dock_number === 4 && playerLevel < 20) isLocked = true;

    const buildingShip = status !== 'empty' && dockData.ship_master_id
        ? shipMasterData.find(m => m.id === dockData.ship_master_id)
        : null;

    const timeLeft = dockData?.completion_time ? new Date(dockData.completion_time).getTime() - new Date().getTime() : 0;

    return (
        <div className={`dock-card dock-status-${isLocked ? 'locked' : status}`}>
            <div className="dock-header">
                <h4>{dockData.dock_number}번 독</h4>
                <span className="dock-status-text">{isLocked ? `Lv.${dockData.dock_number === 3 ? 5 : 20} 해제` : status.toUpperCase()}</span>
            </div>
            <div className="dock-content">
                {status === 'empty' && !isLocked && <p className="dock-message">건조 대기 중...</p>}
                {status === 'building' && (
                    <div className="dock-building-info">
                        <p className="building-ship-name">건조중...</p>
                        <p className="building-timer"><CountdownTimer endTime={dockData.completion_time} /></p>
                        {timeLeft > 0 && timeLeft < 60000 && (
                            <button className="btn btn-secondary" onClick={() => onInstantComplete(dockData.dock_number, false)}>즉시 완료 (무료)</button>
                        )}
                        {player?.instant_build > 0 && (
                            <button className="btn btn-secondary" onClick={() => onInstantComplete(dockData.dock_number, true)}>고속건조</button>
                        )}
                    </div>
                )}
                {status === 'complete' && (
                     <div className="dock-action">
                        <p className="building-ship-name">{buildingShip ? `${buildingShip.ship_name}` : '함선'} 건조 완료!</p>
                        <button className="btn btn-primary" onClick={() => onComplete(dockData.dock_number)}>함선 수령</button>
                    </div>
                )}
                 {isLocked && <div className="lock-overlay">🔒</div>}
            </div>
        </div>
    );
};


const Factory = () => {
    const { player, ships, refreshData, docks } = useGameContext(); 
    
    const isTutorial = ships && ships.length < 4;

    const handleAction = async (actionFunc) => {
        try {
            await actionFunc();
            await refreshData();
        } catch (err) {
            console.error("Factory action failed:", err);
        }
    };

    const handleBuild = (buildType) => {
        const availableDock = docks.find(d => !d.ship_master_id);
        if (!availableDock) {
            alert("사용 가능한 건조 독이 없습니다.");
            return;
        }
        const { resources } = BUILD_TYPES[buildType];
        handleAction(() => api.post('/api/factory/build', { dock_number: availableDock.dock_number, ...resources }));
    };
    
    const handleComplete = (dockNumber) => handleAction(() => api.post('/api/factory/complete', { dock_number: dockNumber }));
    const handleInstantComplete = (dockNumber, useItem) => handleAction(() => api.post('/api/factory/instant-complete', { dock_number: dockNumber, use_item: useItem }));

    const handleTutorialBuild = () => {
        const tutorialRecipes = {
            0: { fuel: 30, ammo: 30, steel: 30, bauxite: 30 }, 
            1: { fuel: 30, ammo: 30, steel: 30, bauxite: 30 }, 
            2: { fuel: 30, ammo: 30, steel: 30, bauxite: 30 }, 
            3: { fuel: 200, ammo: 30, steel: 250, bauxite: 30 },
        };
        const availableDock = docks.find(d => !d.ship_master_id);
        if (!availableDock) return;
        
        const resources = tutorialRecipes[ships.length];
        handleAction(() => api.post('/api/factory/build', { dock_number: availableDock.dock_number, ...resources }));
    }

    return (
        <>
            <h2 className="page-title">공창</h2>
            <p className="page-description">자원을 소모하여 새로운 함선을 건조할 수 있습니다.</p>
            <div className="factory-layout">
                <div className="build-panel">
                    <h3 className="panel-title">함선 건조 (고속건조재: {player?.instant_build || 0}개)</h3>
                    {isTutorial ? (
                        <div className="tutorial-build-card">
                            <h4>튜토리얼 건조 ({ships.length + 1}/4)</h4>
                            <p>정해진 레시피로 다음 함선을 건조합니다.</p>
                            <button className="btn btn-primary" onClick={handleTutorialBuild}>튜토리얼 건조 시작</button>
                        </div>
                    ) : (
                        <div className="build-type-grid">
                            {Object.entries(BUILD_TYPES).map(([type, { name, resources }]) => (
                                <div key={type} className="build-type-card">
                                    <h4>{name}</h4>
                                    <div className="resource-cost">
                                        <span>연료 {resources.fuel}</span> | <span>탄약 {resources.ammo}</span>
                                        <span>강재 {resources.steel}</span> | <span>보크사이트 {resources.bauxite}</span>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => handleBuild(type)}>건조 시작</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="docks-grid">
                    {(docks && docks.length > 0 ? docks : [1, 2, 3, 4].map(n => ({ dock_number: n })))
                        .map(dock => (
                            <Dock 
                                key={dock.dock_number} 
                                dockData={dock} 
                                onComplete={handleComplete}
                                onInstantComplete={handleInstantComplete}
                            />
                        ))
                    }
                </div>
            </div>
        </>
    );
};

export default Factory;