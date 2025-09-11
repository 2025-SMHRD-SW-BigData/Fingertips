# 🅴🅾🅼🅹🆄🅲🅷🅰: AI 기반 장애인 전용 주차관리 시스템

**빅데이터 융합 서비스 개발자 과정 프로젝트**

---

## 👥 팀 소개

| 역할 | 이름 | 담당 |
|------|------|------|
| 팀장 | 구도진 | PM, Front-end |
| 팀원 | 이진우 | Back-end, DB, 배포 |
| 팀원 | 조용운 | Back-end, DB |
| 팀원 | 김미지 | Data Modeling |
| 팀원 | 박재현 | Data Modeling |

---

## 📌 프로젝트 개요

**이음주차**는 장애인 전용 주차구역에서 발생하는 불법 주정차 및 방해 행위를  
AI 기반 영상 분석과 실시간 경고 시스템으로 자동 탐지·계도하는 스마트 주차 관리 플랫폼입니다.

- **목표:** 장애인 주차권 보호 및 주차장 관리 효율화  
- **기간:** 2025.07.01 ~ 2025.08.31  
- **역할:** 팀 단위 공동 개발 (Front-end, Back-end, AI, DB, 배포)

---

## 🚀 주요 서비스

### ✅ 핵심 기능
- **주차 현황 모니터링**  
  CCTV 영상 기반 실시간 주차 상태 확인
- **불법 주차 차량 관리**  
  AI 탐지 후 차량 번호판 인식 및 기록
- **데이터 통계**  
  주차장 점유율, 위반 건수, 이용 패턴 분석
- **알림/경고 시스템**  
  위반 발생 시 관리자 웹 대시보드 실시간 알림

---

## 🛠️ 기술 스택

| 분야 | 기술 |
|------|------|
| Front-end | HTML, CSS, React, TailwindCSS |
| Back-end | Node.js, Express, WebSocket |
| AI / Modeling | YOLOv8, YOLO-Pose, EasyOCR, OpenCV, ResNet, Python |
| Database | MySQL |
| Deployment | AWS Elastic Beanstalk, EC2 |

---

## 🧩 개발 내용

### AI 모델링
- YOLOv8 기반 차량 및 보조기기 객체 탐지  
- EasyOCR로 번호판 문자 추출  
- ResNet 기반 Re-ID 모델로 동일 차량 추적  
- 자체 데이터 수집 및 라벨링 (휠체어, 목발, 박스 등)  
- YOLOv8m 학습 및 모델 검증  

### Front-end
- React + TailwindCSS로 주차 현황·위반 내역 시각화  
- Axios로 Node.js 서버 데이터 조회  
- CCTV 이미지 기반 주차 구역 비어 있음 / 주차 차량 표시  

### Back-end
- Node.js Express 기반 REST API 서버  
- configs, controllers, services, repositories, routes 모듈화  
- WebSocket으로 실시간 웹캠 영상 스트리밍 지원  

### 배포
- AWS Elastic Beanstalk를 통한 배포 및 자동 스케일링  
- 안정적 운영 환경 확보 및 서버 관리 편의성 강화

---

## 🏗️ 시스템 아키텍처

<img width="8949" height="5742" alt="12가3456 (6)" src="https://github.com/user-attachments/assets/b9a3b5cf-bc8b-41ef-870f-955cad9fad77" />

