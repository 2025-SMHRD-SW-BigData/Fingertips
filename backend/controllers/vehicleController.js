const { uploadToS3 } = require("../services/s3Service");
const { insertVehicle } = require("../repositories/vehicleRepository");

const createVehicle = async (req, res) => {
  try {
    const { plateNumber } = req.body;
    const fileBuffer = req.file.buffer;

    if (!plateNumber || !fileBuffer) {
      return res.status(400).json({ error: "번호판 또는 이미지가 누락되었습니다." });
    }

    // 1) S3 업로드
    const imageUrl = await uploadToS3(fileBuffer, plateNumber);

    // 2) DB 저장
    await insertVehicle(plateNumber, imageUrl);

    res.status(201).json({ plateNumber, imageUrl });
  } catch (err) {
    console.error("차량 저장 실패:", err);
    res.status(500).json({ error: "서버 에러" });
  }
};

module.exports = { createVehicle };
