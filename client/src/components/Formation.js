// ~/web-game/client/src/components/Formation.js
import React, { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '../contexts/GameContext';
import api from '../api';
import './Formation.css';

const Formation = () => {
    const { playerShips, refreshData } = useGameContext();
    const [fleets, setFleets] = useState([null, null, null, null]);
    const [selectedFleetNo, setSelectedFleetNo] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/api/fleets');
            const initialFleets = [1, 2, 3, 4].map(num => {
                return res.data.find(f => f.fleet_no === num) || { fleet_no: num, name: `제${num}함대` };
            });
            setFleets(initialFleets);
            setError(null);
        } catch (err) {
            console.error("함대 정보 로딩 실패:", err);
            setError("함대 정보를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveFleet = async (fleetNo) => {
        const fleetToSave = fleets[fleetNo - 1];
        const shipIds = [];
        for (let i = 1; i <= 6; i++) {
            shipIds.push(fleetToSave[`ship_${i}`] ? fleetToSave[`ship_${i}`].instance.id : null);
        }
        try {
            await api.put(`/api/fleets/${fleetNo}`, { ships: shipIds });
            alert(`${fleetNo}함대 편성을 저장했습니다.`);
            
            await fetchData();    // 현재 페이지의 함대 정보 즉시 갱신
            await refreshData();  // GameContext의 모든 데이터(함선 목록 등) 갱신
        } catch (err) {
            console.error("편성 저장 실패:", err);
            alert("편성 저장에 실패했습니다.");
        }
    };
    
    // 사용 가능한(어느 함대에도 소속되지 않은) 함선 목록
    const getAvailableShips = () => {
        const assignedShipIds = new Set();
        fleets.forEach(fleet => {
            if (!fleet) return;
            for (let i = 1; i <= 6; i++) {
                if (fleet[`ship_${i}`]) {
                    assignedShipIds.add(fleet[`ship_${i}`].instance.id);
                }
            }
        });
        return playerShips.filter(ship => !assignedShipIds.has(ship.id));
    };

    // 우측 목록의 함선을 클릭했을 때의 동작
    const handleAssignShip = (ship) => {
        if (selectedSlotIndex === null) {
            alert('먼저 변경할 함대 슬롯을 선택해주세요.');
            return;
        }

        const newFleets = JSON.parse(JSON.stringify(fleets));
        const currentFleet = newFleets[selectedFleetNo - 1];
        
        // 새로 편성할 함선이 이미 다른 곳에 있다면, 그 자리부터 비움
        const existingSlotInfo = findShipSlot(ship.id);
        if (existingSlotInfo) {
            newFleets[existingSlotInfo.fleetIndex][`ship_${existingSlotInfo.slotIndex}`] = null;
        }

        // 선택된 슬롯에 새 함선 정보 할당
        currentFleet[`ship_${selectedSlotIndex + 1}`] = {
            instance: ship,
            master: ship.ship_master
        };

        setFleets(newFleets);
        setSelectedSlotIndex(null); // 슬롯 선택 해제
    };
    
    // 함대 슬롯에서 '해제' 버튼을 눌렀을 때
    const handleUnassignShip = (slotIndex) => {
        const newFleets = [...fleets];
        newFleets[selectedFleetNo - 1][`ship_${slotIndex + 1}`] = null;
        setFleets(newFleets);
    };

    const findShipSlot = (shipId) => {
        for (let fleetIndex = 0; fleetIndex < fleets.length; fleetIndex++) {
            const fleet = fleets[fleetIndex];
            if (!fleet) continue;
            for (let i = 1; i <= 6; i++) {
                if (fleet[`ship_${i}`] && fleet[`ship_${i}`].instance.id === shipId) {
                    return { fleetIndex, slotIndex: i };
                }
            }
        }
        return null;
    };
    
    if (isLoading) return <div className="formation-page"><h2>로딩 중...</h2></div>;
    if (error) return <div className="formation-page"><h2>{error}</h2></div>;
    
    const currentFleet = fleets[selectedFleetNo - 1];
    const availableShips = getAvailableShips();

    return (
        <div className="formation-page">
            <div className="fleet-panel">
                <div className="fleet-tabs">
                    {fleets.map((fleet, index) => (
                        <button key={index + 1}
                            className={`fleet-tab ${selectedFleetNo === (index + 1) ? 'active' : ''}`}
                            onClick={() => setSelectedFleetNo(index + 1)}>
                            {fleet?.name || `제${index + 1}함대`}
                        </button>
                    ))}
                </div>
                {currentFleet && (
                    <ul className="fleet-slots-list">
                        {[...Array(6)].map((_, i) => {
                            const shipData = currentFleet[`ship_${i + 1}`];
                            return (
                                <li key={i} className={`fleet-slot-card ${selectedSlotIndex === i ? 'selected' : ''}`}>
                                    <div className="slot-index">{i + 1}</div>
                                    {shipData ? (
                                        <div className="ship-info">
                                            <span className="ship-name">{shipData.master.ship_name}</span>
                                            <span className="ship-level">Lv.{shipData.instance.level}</span>
                                            <button className="change-button" onClick={() => setSelectedSlotIndex(i)}>변경</button>
                                            <button className="unassign-button" onClick={() => handleUnassignShip(i)}>해제</button>
                                        </div>
                                    ) : (
                                        <div className="empty-slot" onClick={() => setSelectedSlotIndex(i)}>
                                            <span>편성 가능</span>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
                <button className="save-fleet-button" onClick={() => handleSaveFleet(selectedFleetNo)}>
                    {selectedFleetNo}함대 편성 저장
                </button>
            </div>

            <div className="available-ships-panel">
                <h3>보유 함선 목록</h3>
                {/* 향후 여기에 필터/정렬 UI 추가 */}
                <div className="available-ships-grid">
                    {availableShips.map(ship => (
                        <div key={ship.id} className="ship-assign-card" onClick={() => handleAssignShip(ship)}>
                            <div className="ship-assign-header">
                                <span className="ship-name">{ship.ship_master.ship_name}</span>
                                <span className="ship-level">Lv.{ship.level}</span>
                            </div>
                            <div className="ship-assign-body">
                                <span>HP: {ship.current_hp} / {ship.ship_master.hp_base}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Formation;