import cv2
from ultralytics import YOLO
import easyocr
import re
from collections import Counter
import requests

# -----------------------------
# 1. OCR 후처리 함수
# -----------------------------
def post_process_plate_text(raw_text):
    plate_pattern = re.compile(r'\d{2,3}[가-힣]{1}\d{4}')
    cleaned_text = raw_text.replace(' ', '').replace('-', '')
    match = plate_pattern.search(cleaned_text)
    if match:
        return match.group(0)
    return None

# -----------------------------
# 2. AI 모델 로딩
# -----------------------------
print("AI 모델 로딩 중...")
car_model = YOLO('./model/car_model.pt')
plate_model = YOLO('./model/plate_model.pt')
reader = easyocr.Reader(['ko', 'en'])
print("모델 로딩 완료!")

# -----------------------------
# 3. 영상 설정
# -----------------------------
video_path = 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/venu_ocrTest.mp4'  # 로컬에 다운로드한 영상 사용 권장
cap = cv2.VideoCapture(video_path)
frame_interval = 6
frame_count = 0

detected_plates_list = []
plate_frames = {}
plate_confidences = {}

# -----------------------------
# 4. 영상 처리
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
            if car_crop.size == 0:
                continue

            plate_results = plate_model(car_crop, verbose=False)
            for plate_r in plate_results:
                for plate_box in plate_r.boxes:
                    px1, py1, px2, py2 = map(int, plate_box.xyxy[0])
                    plate_crop = car_crop[py1:py2, px1:px2]
                    if plate_crop.size == 0:
                        continue

                    confidence = float(plate_box.conf[0])
                    ocr_result = reader.readtext(plate_crop, detail=0)
                    if ocr_result:
                        raw_text = "".join(ocr_result)
                        processed_text = post_process_plate_text(raw_text)
                        if processed_text:
                            detected_plates_list.append(processed_text)
                            if (processed_text not in plate_confidences) or (confidence > plate_confidences[processed_text]):
                                plate_confidences[processed_text] = confidence
                                plate_frames[processed_text] = frame.copy()

cap.release()

# -----------------------------
# 5. 최고 신뢰도 번호판 선택
# -----------------------------
if not detected_plates_list:
    print("번호판을 탐지하지 못했습니다.")
    exit()

plate_counts = Counter(detected_plates_list)
most_common_plate = plate_counts.most_common(1)[0][0]
best_frame = plate_frames[most_common_plate]

print(f"가장 높은 빈도의 번호판: {most_common_plate}")

# -----------------------------
# 6. Node.js 서버로 이미지 전송
# -----------------------------
API_URL = "http://localhost:3000/api/vehicles"

# OpenCV 이미지를 JPEG 바이트로 변환
_, buffer = cv2.imencode('.jpg', best_frame)
files = {'image': ('plate.jpg', buffer.tobytes(), 'image/jpeg')}
data = {'plateNumber': most_common_plate}

try:
    response = requests.post(API_URL, files=files, data=data)
    if response.status_code == 201:
        print("Node.js 서버에 DB 저장 완료:", response.json())
    else:
        print("DB 저장 실패:", response.status_code, response.text)
except Exception as e:
    print("서버 요청 중 오류 발생:", e)
