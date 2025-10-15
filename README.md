# ⚓ Fleet Project (web-game)

> 함대 컬렉션(Fleet Collection) 형태의 웹 게임 토이 프로젝트.  
> 칸코레(艦これ), 벽람항로(Azur Lane) 등에서 영감을 받아 제작 중입니다.  
> **실행 사이트:** [http://fleet.myvnc.com/](http://fleet.myvnc.com/)

---

## 🚀 프로젝트 개요

Fleet Project는 웹 환경에서 즐길 수 있는 **함선 수집·편성형 시뮬레이션 게임**입니다.  
플레이어는 모항(메인 페이지)을 중심으로 함선을 관리하며, 출격, 수리, 개조, 보급,  
건조 등 다양한 활동을 수행할 수 있습니다.

> 이 프로젝트는 학습과 실험을 위한 **개인 토이 프로젝트**이며 상업적 목적 없이 개발 중입니다.

---

## 🧩 주요 기능

- 🔐 Google 로그인 기반 자동 회원가입 및 로그인  
- ⚓ 모항 (메인 페이지)  
- ⚙️ 함대 편성 (Fleet Organization)  
- 🛠️ 보급 (Supply)  
- 🔧 수리 (Repair)  
- ⚡ 개조 (Modernization)  
- 🏗️ 공창 (Dock / Construction)  
- 🚢 출격 (Sortie / Battle Mission)  
- 📖 도감 (Ship Encyclopedia)

---

## 🛠️ 기술 스택

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

| 구분 | 기술 |
|------|------|
| 서버 환경 | Oracle Cloud Instance (Ubuntu) |
| Frontend | React.js |
| Backend | Node.js |
| Database | PostgreSQL |
| IDE | Visual Studio Code |
| 웹서버 | Nginx |
| 배포 방식 | Shell Script 기반 수동 배포 (`deploy.sh`) |

---

## ⚙️ 설치 및 배포

```bash
cd ~/web-game
./deploy.sh
```

> 배포 스크립트는 client 빌드 및 backend/nginx 재시작을 자동 처리합니다.
> 개발자는 위 명령만으로 최신 코드를 서버에 배포할 수 있습니다.

---

## 📂 프로젝트 구조
```bash
web-game/
├── client/             # React 프론트엔드
├── server/             # Node.js 백엔드
├── deploy.sh           # 배포 스크립트
├── package.json
└── README.md
```

---

## 🔍 개발 및 운영 상태
- Oracle Cloud Ubuntu 환경에서 상시 운영 중
- Nginx를 통한 정적 리소스 서빙
- Systemd로 백엔드 서비스 관리
- VSCode 기반 로컬 개발 후 서버 반영
- PostgreSQL 데이터베이스 연동 완료
- 현재 Docker 미도입 (향후 도입 예정)

---

## 🧠 향후 계획
- Docker 및 CI/CD 자동 배포 파이프라인 구축
- 게임 내 자원 시스템 구현
- 전투 시뮬레이션 로직 및 UI 개발
- 반응형 레이아웃 및 모바일 환경 최적화
- 게임 데이터 저장 및 도감 확장 기능 추가

---

## 💬 기타
- 이 프로젝트는 학습과 실험용 **개인 토이 프로젝트**입니다.
- 상업적 운영이나 과금 요소는 포함되어 있지 않으며, 개발자 간 기술 공유 및 연습용으로 사용됩니다.

---
