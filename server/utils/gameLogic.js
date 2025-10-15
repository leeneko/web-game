/**
 * 레벨업에 따른 스탯 성장치를 계산하는 함수
 * @param {number} baseStat - 1레벨 스탯
 * @param {number} maxStat - 최대 레벨 스탯
 * @param {number} level - 현재 레벨
 * @param {number} maxLevel - 최대 레벨 (예: 99)
 * @returns {number} - 레벨 보너스가 포함된 스탯 (소수점 버림)
 */
function calculateStatForLevel(baseStat, maxStat, level, maxLevel = 99) {
    if (level === 1) return baseStat;
    if (level >= maxLevel) return maxStat;

    // 선형 보간법을 사용하여 중간 레벨의 스탯을 계산
    const growth = (maxStat - baseStat) / (maxLevel - 1);
    const currentStat = baseStat + growth * (level - 1);
    return Math.floor(currentStat);
}

/**
 * 함선의 모든 최종 능력치를 계산하는 메인 함수
 * @param {object} shipMaster - ship_master 테이블의 데이터
 * @param {object} shipInstance - ships 테이블의 데이터
 * @param {Array<object>} equippedItems - 장착된 장비의 master 데이터 배열
 * @returns {object} - 최종 계산된 모든 능력치가 포함된 객체
 */
function calculateFinalShipStats(shipMaster, shipInstance, equippedItems = []) {
    const finalStats = {};
    const level = shipInstance.level;

    // 1. 레벨업 성장치 계산
    finalStats.hp = calculateStatForLevel(shipMaster.hp_base, shipMaster.hp_max, level);
    finalStats.firepower = calculateStatForLevel(shipMaster.firepower_base, shipMaster.firepower_max, level);
    finalStats.torpedo = calculateStatForLevel(shipMaster.torpedo_base, shipMaster.torpedo_max, level);
    finalStats.aa = calculateStatForLevel(shipMaster.aa_base, shipMaster.aa_max, level);
    finalStats.armor = calculateStatForLevel(shipMaster.armor_base, shipMaster.armor_max, level);
    // ... 다른 스탯들도 동일하게 계산 (evasion, asw, los, luck 등)

    // 2. 개조(Modernization) 보너스 합산
    finalStats.firepower += shipInstance.modernized_firepower;
    finalStats.torpedo += shipInstance.modernized_torpedo;
    finalStats.aa += shipInstance.modernized_aa;
    finalStats.armor += shipInstance.modernized_armor;

    // 3. 장비 보너스 합산
    for (const item of equippedItems) {
        finalStats.firepower += item.firepower || 0;
        finalStats.torpedo += item.torpedo || 0;
        finalStats.aa += item.aa || 0;
        finalStats.armor += item.armor || 0;
        // ... 다른 장비 스탯들도 합산
    }

    // 4. 변하지 않는 값들 추가
    finalStats.current_hp = shipInstance.current_hp;
    finalStats.level = shipInstance.level;
    finalStats.exp = shipInstance.exp;
    finalStats.ship_name = shipMaster.ship_name;
    // ... 기타 필요한 정보들

    return finalStats;
}

module.exports = { calculateFinalShipStats };