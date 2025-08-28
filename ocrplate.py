from ultralytics import YOLO
import easyocr
import re
from collections import Counter

# -----------------------------
# 1. OCR 후처리 함수
# -----------------------------
def post_process_plate_text(raw_text):
    plate_pattern = re.compile(r'\d{2,3}[가-힣]{1}\d{4}')
    cleaned_text = raw_text.replace(' ', '')
    match = plate_pattern.search(cleaned_text)
    if match:
        return match.group(0)
    else:
        return None

# -----------------------------
# 2. AI 모델 로딩
# -----------------------------
print("AI 모델들을 로딩합니다...")
car_model = YOLO('./model/car_model.pt')
plate_model = YOLO('./model/plate_model.pt')
reader = easyocr.Reader(['ko', 'en'])
print("모델 로딩 완료!")

# -----------------------------
# 3. 영상 설정
# -----------------------------
video_path = 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/venu_ocrTest.mp4'

import cv2
cap = cv2.VideoCapture(video_path)

frame_interval = 6  # 예: 6프레임마다 처리
frame_count = 0
detected_plates_list = []

# -----------------------------
# 4. 메인 영상 처리 루프
# -----------------------------
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    if frame_count % frame_interval != 0:
        continue

    car_results = car_model(frame, verbose=False)
    for car_r in car_results:
        for car_box in car_r.boxes:
            cx1, cy1, cx2, cy2 = map(int, car_box.xyxy[0])
            car_crop = frame[cy1:cy2, cx1:cx2]
            if car_crop.size == 0: continue

            plate_results = plate_model(car_crop, verbose=False)
            for plate_r in plate_results:
                for plate_box in plate_r.boxes:
                    px1, py1, px2, py2 = map(int, plate_box.xyxy[0])
                    plate_crop = car_crop[py1:py2, px1:px2]
                    if plate_crop.size == 0: continue

                    ocr_result = reader.readtext(plate_crop, detail=0)
                    if ocr_result:
                        raw_text = "".join(ocr_result)
                        processed_text = post_process_plate_text(raw_text)
                        if processed_text:
                            detected_plates_list.append(processed_text)

cap.release()

# -----------------------------
# 5. 가장 많이 나온 번호판 선정
# -----------------------------
if not detected_plates:
    print("번호판을 탐지하지 못했습니다.")
else:
    plate_counts = Counter([p[0] for p in detected_plates])
    most_common_plate = plate_counts.most_common(1)[0][0]
    # DB에 넣을 이미지 파일 경로 중 첫 번째 것 선택
    image_path = [p[1] for p in detected_plates if p[0] == most_common_plate][0]
    print(f"가장 많이 탐지된 번호판: {most_common_plate}, 이미지: {image_path}")

    # -----------------------------
    # 6. DB 연결 및 저장
    # -----------------------------
    db_config = {
        'host': 'project-db-campus.smhrd.com',
        'port': 3307,
        'user': 'campus_25SW_BD_p3_1',
        'password': 'smhrd1',
        'database': 'campus_25SW_BD_p3_1'
    }

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        sql = "INSERT INTO tb_vehicle (ve_number, ve_img) VALUES (%s, %s)"
        cursor.execute(sql, (most_common_plate, image_path))
        conn.commit()
        print("DB 저장 완료!")
    except Exception as e:
        print("DB 저장 실패:", e)
    finally:
        cursor.close()
        conn.close()