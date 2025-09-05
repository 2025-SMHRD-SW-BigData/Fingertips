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

## 📌 프로젝트 소개

**이음주차**는 장애인 전용 주차구역에서 발생하는 불법 주정차 및 방해 행위를  
실시간 영상 인식 기술과 AI 기반 분석을 통해 자동으로 탐지하고 계도하는 시스템입니다.

---

## 🚀 주요 서비스

- **주차 현황 모니터링 서비스**  
  실시간 CCTV 영상 기반 주차 상태 확인
- **불법 주차 차량 관리 서비스**  
  AI 기반 불법 주차 차량 탐지 및 기록
- **데이터 통계 서비스**  
  주차장 이용 패턴, 점유율, 위반 건수 분석
- **알림 및 경고 시스템**  
  위반 발생 시 관리자에게 실시간 알림

---

## 🛠️ 기술 스택

**Front-end:** HTML, CSS, React, TailwindCSS  
**Back-end:** Node.js, Express, WebSocket  
**AI / Modeling:** YOLOv8, YOLO-Pose, EasyOCR, OpenCV, ResNet, Colab, Python  
**Database:** MySQL  
**Deployment:** Elastic Beanstalk, EC2  

---

## 📊 프로젝트 개발 내용

### AI 모델링
- YOLOv8 기반 객체 탐지 모델 (자동차, 오토바이, 트럭)  
- EasyOCR로 번호판 텍스트 추출  
- Re-ID 모델: ResNet 사용, 특징 벡터 추출 후 동일 차량 인식  
- AI-hub, YOLO-Pose, 고정 규칙을 통한 자체 데이터 생성  
- 실제 데이터 수집, 전처리, 라벨링 (휠체어, 목발, 보조기기, 박스)  
- YOLOv8m 학습 진행

### Front-end
- React 기반 주차장 현황, 위반 내역, 경고 알림 실시간 시각화  
- Node.js 서버에서 MySQL 데이터 Axios로 조회 후 화면 표시  
- CCTV 이미지 기반 주차 구역 빈자리/주차 차량 표시

### Back-end
- Node.js 기반 RESTful API 서버 개발  
- configs, controllers, services, repositories, routes 모듈화  
- WebSocket 기반 실시간 웹캠 영상 스트리밍

### 배포
- Elastic Beanstalk 배포로 자동 스케일링 및 로드 밸런싱  
- 배포 자동화 및 운영 편의성 확보, 서비스 안정성 강화

---

## 🏗️ 시스템 아키텍처

