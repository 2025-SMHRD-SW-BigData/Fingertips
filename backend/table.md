CREATE TABLE `tb_vehicle` (
  `ve_number` VARCHAR(50) PRIMARY KEY NOT NULL COMMENT '차량 번호',
  `ve_img` VARCHAR(1000) COMMENT '차량 이미지',
  `created_at` TIMESTAMP NOT NULL COMMENT '등록 일자'
);

CREATE TABLE `tb_camera` (
  `camera_idx` INT PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT '카메라 고유번호',
  `camera_loc` VARCHAR(255) NOT NULL COMMENT '카메라 위치',
  `camera_ip` VARCHAR(15) NOT NULL COMMENT 'IP 주소',
  `installed_at` TIMESTAMP NOT NULL COMMENT '설치 일시'
);

CREATE TABLE `tb_detection` (
  `ve_detection_idx` INT PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT '탐지 고유번호',
  `camera_idx` INT NOT NULL COMMENT '카메라 고유번호',
  `parking_idx` INT NOT NULL COMMENT '주차장 고유번호',
  `ve_number` VARCHAR(50) NOT NULL COMMENT '차량 번호',
  `file_idx` INT NOT NULL COMMENT '파일 고유번호',
  `detect_type` VARCHAR(30) NOT NULL COMMENT '탐지 유형',
  `prediction_accuracy` DECIMAL(5,2) NOT NULL COMMENT '예측 정확도',
  `detected_at` TIMESTAMP NOT NULL COMMENT '탐지 일시'
);

CREATE TABLE `tb_admin` (
  `admin_id` VARCHAR(50) PRIMARY KEY NOT NULL COMMENT '관리자 아이디',
  `hashed_password` VARCHAR(255) NOT NULL COMMENT '관리자 비밀번호',
  `name` VARCHAR(50) NOT NULL COMMENT '관리자이름',
  `phone` VARCHAR(20) NOT NULL COMMENT '관리자연락처',
  `email` VARCHAR(50) NOT NULL COMMENT '관리자이메일',
  `role` VARCHAR(10) NOT NULL COMMENT '관리자권한',
  `joined_at` TIMESTAMP NOT NULL COMMENT '가입 일자',
  `last_logged_at` TIMESTAMP COMMENT '마지막 접속 일자'
);

CREATE TABLE `tb_violation` (
  `violation_idx` INT PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT '위반 고유번호',
  `ve_detection_idx` INT NOT NULL COMMENT '탐지 고유번호',
  `violation_type` VARCHAR(50) NOT NULL COMMENT '위반 유형',
  `prediction_accuracy` DECIMAL(5,2) NOT NULL COMMENT '예측 정확도',
  `created_at` TIMESTAMP NOT NULL COMMENT '등록 일자'
);

CREATE TABLE `tb_assistive_device_detection` (
  `a_detection_idx` INT PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT '탐지 식별자',
  `detection_idx` INT NOT NULL COMMENT '탐지 ID',
  `assitive_device_name` VARCHAR(60) NOT NULL COMMENT '보조 기기',
  `prediction_accuracy` DECIMAL(5,2) NOT NULL COMMENT '예측 정확도',
  `detected_at` TIMESTAMP NOT NULL COMMENT '탐지 날짜'
);

CREATE TABLE `tb_alert` (
  `alert_idx` INT PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT '알림 고유번호',
  `violation_idx` INT NOT NULL COMMENT '위반 고유번호',
  `alert_type` VARCHAR(10) NOT NULL COMMENT '알림 유형',
  `alert_msg` VARCHAR(1500) NOT NULL COMMENT '알림 메시지',
  `sent_at` TIMESTAMP NOT NULL COMMENT '알림 발송 일시',
  `is_success` CHAR(1) NOT NULL COMMENT '알림 전송 여부',
  `admin_id` VARCHAR(50) NOT NULL COMMENT '수신자 아이디',
  `read_at` TIMESTAMP COMMENT '읽기 여부',
  `admin_status` CHAR(1) NOT NULL COMMENT '처리 상태',
  `admin_content` TEXT NOT NULL COMMENT '처리 내용',
  `processed_at` TIMESTAMP NOT NULL COMMENT '처리 일시'
);

CREATE TABLE `tb_parking` (
  `PARKING_IDX` INT PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT '주차장 고유번호',
  `PARKING_LOC` VARCHAR(255) NOT NULL COMMENT '주차장 주소'
);

CREATE TABLE `tb_storage` (
  `FILE_IDX` INT PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT '파일 고유번호',
  `FILE_NAME` VARCHAR(255) NOT NULL COMMENT '파일 이름',
  `FILE_SRC` VARCHAR(255) NOT NULL COMMENT '파일 경로',
  `FILE_TYPE` VARCHAR(10) NOT NULL COMMENT '파일 타입'
);

ALTER TABLE `tb_detection` ADD CONSTRAINT `FK_tb_detection_ve_number_tb_vehicle_ve_number` FOREIGN KEY (`ve_number`) REFERENCES `tb_vehicle` (`ve_number`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `tb_detection` ADD CONSTRAINT `FK_tb_detection_camera_idx_tb_camera_camera_idx` FOREIGN KEY (`camera_idx`) REFERENCES `tb_camera` (`camera_idx`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `tb_violation` ADD CONSTRAINT `FK_tb_violation_ve_detection_idx_tb_detection_ve_detection_idx` FOREIGN KEY (`ve_detection_idx`) REFERENCES `tb_detection` (`ve_detection_idx`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `tb_assistive_device_detection` ADD CONSTRAINT `FK_tb_assistive_device_detection_detection_idx_tb_detection_ve_d` FOREIGN KEY (`detection_idx`) REFERENCES `tb_detection` (`ve_detection_idx`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `tb_alert` ADD CONSTRAINT `FK_tb_alert_violation_idx_tb_violation_violation_idx` FOREIGN KEY (`violation_idx`) REFERENCES `tb_violation` (`violation_idx`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `tb_alert` ADD CONSTRAINT `FK_tb_alert_admin_id_tb_admin_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `tb_admin` (`admin_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `tb_detection` ADD FOREIGN KEY (`parking_idx`) REFERENCES `tb_parking` (`PARKING_IDX`);

ALTER TABLE `tb_detection` ADD FOREIGN KEY (`file_idx`) REFERENCES `tb_storage` (`FILE_IDX`);

CREATE TABLE `tb_parking_space` (
  `space_id` VARCHAR(20) PRIMARY KEY NOT NULL COMMENT '주차 공간 ID (e.g., A-01)',
  `parking_idx` INT NOT NULL COMMENT '주차장 고유번호',
  `space_type` VARCHAR(20) NOT NULL DEFAULT 'general' COMMENT '공간 유형 (general, disabled, ev)',
  `is_occupied` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '점유 여부',
  `ve_number` VARCHAR(50) COMMENT '점유 차량 번호',
  `occupied_at` TIMESTAMP COMMENT '점유 시작 시간',
  FOREIGN KEY (`parking_idx`) REFERENCES `tb_parking`(`PARKING_IDX`)
);

CREATE TABLE `tb_parking_log` (
  `log_idx` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `ve_number` VARCHAR(50) NOT NULL,
  `space_id` VARCHAR(20) NOT NULL,
  `entry_at` TIMESTAMP NOT NULL COMMENT '입차 시간',
  `exit_at` TIMESTAMP COMMENT '출차 시간',
  FOREIGN KEY (`space_id`) REFERENCES `tb_parking_space`(`space_id`)
);