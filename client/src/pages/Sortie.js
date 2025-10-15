import React, { useState, useEffect, useContext } from 'react';
// import { GameContext } from '../context/GameContext'; // GameContext가 있다면 사용
import api from '../api'; // API 호출 함수가 있는 파일
import './Sortie.css'; // 곧 생성할 CSS 파일

// 임시 해역 데이터 (추후 API로 대체)
const mockMapsData = [
  { id: 1, map_no: '1-1', name: '진수부 정면 해역', difficulty: 1, unlocked: true },
  { id: 2, map_no: '1-2', name: '남서제도 앞바다', difficulty: 2, unlocked: true },
  { id: 3, map_no: '1-3', name: '세이론 섬 앞바다', difficulty: 3, unlocked: false },
  { id: 4, map_no: '1-4', name: '카무란 반도', difficulty: 4, unlocked: false },
];

const Sortie = () => {
  // const { playerData } = useContext(GameContext); // 함대 정보 등을 위해 필요할 수 있음
  const [maps, setMaps] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 현재 선택된 함대 번호 (임시로 1번 함대로 고정)
  const currentFleetNo = 1;

  useEffect(() => {
    const fetchMaps = async () => {
      setIsLoading(true);
      try {
        // TODO: 추후 실제 API 호출로 변경
        // const response = await api.get('/api/sortie/maps');
        // setMaps(response.data);
        setMaps(mockMapsData); // 지금은 임시 데이터 사용
      } catch (err) {
        setError('해역 정보를 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaps();
  }, []);

  const handleMapSelect = (mapId, isUnlocked) => {
    if (isUnlocked) {
      setSelectedMapId(mapId);
    }
  };

  const handleSortieStart = async () => {
    if (!selectedMapId) {
      alert('출격할 해역을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/api/sortie/start', {
        fleetNo: currentFleetNo,
        mapId: selectedMapId,
      });
      
      console.log('출격 성공:', response.data);
      // TODO: 출격 성공 시, 나침반 화면 등으로 화면 전환하는 로직 구현
      alert(`출격을 시작합니다! (출격 ID: ${response.data.sortieLogId})`);
      
    } catch (err) {
      const errorMsg = err.response?.data?.msg || '출격에 실패했습니다.';
      setError(errorMsg);
      console.error(err.response);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMap = maps.find(m => m.id === selectedMapId);

  return (
    <div className="sortie-container">
      <h1>출격</h1>
      <div className="sortie-layout">
        <div className="map-list-panel">
          <h2>해역 선택</h2>
          {isLoading && <p>로딩 중...</p>}
          <div className="map-list">
            {maps.map((map) => (
              <div
                key={map.id}
                className={`map-card ${selectedMapId === map.id ? 'selected' : ''} ${!map.unlocked ? 'locked' : ''}`}
                onClick={() => handleMapSelect(map.id, map.unlocked)}
              >
                <div className="map-card-header">{map.map_no}</div>
                <div className="map-card-body">{map.name}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="sortie-info-panel">
          <h2>출격 정보</h2>
          {selectedMap ? (
            <div>
              <h3>{selectedMap.name} ({selectedMap.map_no})</h3>
              <p>난이도: {'★'.repeat(selectedMap.difficulty)}</p>
              <p>선택된 함대: {currentFleetNo}함대</p>
              {/* TODO: 선택된 함대의 함선 목록 표시 */}
              <button className="sortie-start-btn" onClick={handleSortieStart} disabled={isLoading}>
                출격 개시
              </button>
            </div>
          ) : (
            <p>좌측에서 출격할 해역을 선택하세요.</p>
          )}
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Sortie;