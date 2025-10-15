#!/bin/bash

# -- 스크립트 시작 --

echo "======================================="
echo "fleet 배포를 시작합니다."
echo "======================================="

# 1. 프론트엔드 빌드
echo ""
echo "[1/3] 프론트엔드 최신 코드를 빌드합니다..."
cd ~/web-game/client && npm run build

if [ $? -ne 0 ]; then
    echo "!!! 프론트엔드 빌드 실패! 스크립트를 중단합니다. !!!"
    exit 1
fi
echo "프론트엔드 빌드 성공!"

# 2. 백엔드 서비스 재시작 (systemd 사용)
echo ""
echo "[2/3] 백엔드 서비스를 재시작합니다..."
sudo systemctl restart backend.service

# 3. Nginx 웹서버 재시작
echo ""
echo "[3/3] Nginx 웹서버를 재시작합니다..."
sudo systemctl restart nginx

echo ""
echo "======================================="
echo "배포가 성공적으로 완료되었습니다."
echo "======================================="
echo ""
echo "백엔드 서버 상태 확인:"
sudo systemctl status backend.service -n 5 --no-pager