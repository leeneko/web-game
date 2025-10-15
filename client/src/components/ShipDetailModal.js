import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ShipDetailModal.css'; // 아래에 제공될 CSS

const ShipDetailModal = ({ shipId, onClose }) => {
    const [shipData, setShipData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!shipId) return;

        const fetchShipDetails = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/ships/${shipId}`);
                setShipData(res.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching ship details:", err);
                setError("함선 정보를 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchShipDetails();
    }, [shipId]);

    if (!shipId) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>X</button>
                {loading && <p>로딩 중...</p>}
                {error && <p>{error}</p>}
                {shipData && (
                    <>
                        <h2>{shipData.master.ship_name} <span className="ship-level">Lv.{shipData.instance.level}</span></h2>
                        <div className="ship-stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">내구 (HP)</span>
                                <span className="stat-value">{shipData.finalStats.current_hp} / {shipData.finalStats.hp}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">화력</span>
                                <span className="stat-value">{shipData.finalStats.firepower}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">뇌장</span>
                                <span className="stat-value">{shipData.finalStats.torpedo}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">대공</span>
                                <span className="stat-value">{shipData.finalStats.aa}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">장갑</span>
                                <span className="stat-value">{shipData.finalStats.armor}</span>
                            </div>
                            {/* 다른 스탯들도 여기에 추가 */}
                        </div>
                        {/* 향후 여기에 장비 슬롯 UI가 들어갑니다. */}
                    </>
                )}
            </div>
        </div>
    );
};

export default ShipDetailModal;