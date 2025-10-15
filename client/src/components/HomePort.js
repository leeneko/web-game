// ~/client/src/components/HomePort.js
import React, {useState} from 'react';
import { useGameContext } from '../contexts/GameContext';
import ShipDetailModal from './ShipDetailModal';
import './HomePort.css';

const HomePort = () => {
    const { playerShips, loading } = useGameContext();
    const [selectedShipId, setSelectedShipId] = useState(null);

    const handleShipClick = (shipId) => {
        setSelectedShipId(shipId);
    };

    const handleCloseModal = () => {
        setSelectedShipId(null);
    };

    if (loading) {
        return <div className="homeport-container"><h3>함선 목록 로딩 중...</h3></div>;
    }

    return (
        <div className="homeport-container">
            <h2 className="page-title">모항</h2>
            <p className="page-description">보유 중인 함선 목록입니다. 카드를 클릭하여 상세 정보를 확인하세요.</p>
            
            <div className="ship-card-grid">
                {playerShips.length > 0 ? (
                    playerShips.map(ship => {
                        // 레벨 1의 스탯(base)을 기준으로 표시합니다.
                        const master = ship.ship_master;
                        return (
                            <div key={ship.id} className="ship-card" onClick={() => handleShipClick(ship.id)}>
                                <div className="ship-card-header">
                                    <span className="ship-name">{master.ship_name}</span>
                                    <span className="ship-level">Lv.{ship.level}</span>
                                </div>
                                <div className="ship-card-body">
                                    <div className="hp-bar-container">
                                        <span className="hp-label">HP</span>
                                        <div className="hp-bar">
                                            <div className="hp-bar-current" style={{ width: `${(ship.current_hp / master.hp_base) * 100}%` }}></div>
                                        </div>
                                        <span className="hp-text">{ship.current_hp} / {master.hp_base}</span>
                                    </div>
                                    <div className="ship-card-stats">
                                        <span>화력: {master.firepower_base}</span>
                                        <span>뇌장: {master.torpedo_base}</span>
                                        <span>대공: {master.aa_base}</span>
                                        <span>장갑: {master.armor_base}</span>
                                    </div>
                                </div>
                                <div className="ship-card-footer">
                                    상세보기
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-ships-message">
                        <p>보유 중인 함선이 없습니다.</p>
                        <span>공창에서 새로운 함선을 건조해보세요!</span>
                    </div>
                )}
            </div>

            {selectedShipId && (
                <ShipDetailModal shipId={selectedShipId} onClose={handleCloseModal} />
            )}
        </div>
    );
};

export default HomePort;