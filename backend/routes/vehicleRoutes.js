const express = require("express");
const multer = require("multer");
const { createVehicle } = require("../controllers/vehicleController");

const router = express.Router();
const upload = multer();

router.post("/upload", upload.single("image"), createVehicle);

module.exports = router;
