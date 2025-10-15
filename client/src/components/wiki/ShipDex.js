// ~/web-game/client/src/components/wiki/ShipDex.js

import React, { useState, useEffect } from 'react';
import api from '../../api';
import './ShipDex.css'; // 새로 생성할 CSS 파일을 import 합니다.

const ShipDex = () => {
    const [ships, setShips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShips = async () => {
            try {
                const res = await api.get('/api/wiki/ships'); 
                // 이름순으로 정렬하여 데이터를 설정합니다.
                const sortedShips = res.data.sort((a, b) => a.ship_name.localeCompare(b.ship_name));
                setShips(sortedShips);
            } catch (err) {
                console.error("함선 목록 로딩 실패:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchShips();
    }, []);

    if (loading) {
        return (
            <>
                <h2 className="page-title">함선 도감</h2>
                <p>도감 데이터를 불러오는 중...</p>
            </>
        );
    }

    return (
        // App.js의 .panel-container가 배경과 패딩을 제공하므로 불필요한 div 제거
        <>
            <h2 className="page-title">함선 도감</h2>
            <p className="page-description">게임에 등장하는 모든 함선의 최대 능력치를 확인할 수 있습니다.</p>

            <div className="table-container">
                <table className="ship-dex-table">
                    <thead>
                        <tr>
                            <th className="text-center">ID</th>
                            <th>이름</th>
                            <th>국가</th>
                            <th>함종</th>
                            <th className="text-right">내구</th>
                            <th className="text-right">화력</th>
                            <th className="text-right">뇌장</th>
                            <th className="text-right">대공</th>
                            <th className="text-right">장갑</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ships.map(ship => (
                            <tr key={ship.id}>
                                <td className="text-center">{ship.id}</td>
                                <td className="ship-name-cell">{ship.ship_name}</td>
                                <td>{ship.country}</td>
                                <td>{ship.ship_type}</td>
                                {/* 최대 스탯만 표시하여 가독성 향상 */}
                                <td className="text-right">{ship.hp_max}</td>
                                <td className="text-right">{ship.firepower_max}</td>
                                <td className="text-right">{ship.torpedo_max}</td>
                                <td className="text-right">{ship.aa_max}</td>
                                <td className="text-right">{ship.armor_max}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default ShipDex;