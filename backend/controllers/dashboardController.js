const dashboardService = require('../services/dashboardService');

const getParkingLogs = async (req, res, next) => {
  try {
    const parkingIdx = parseInt(req.query.parking_idx, 10);
    const logs = await dashboardService.getParkingLogs(parkingIdx);
    res.json(logs);
  } catch (err) {
    console.error('Error in getParkingLogs controller', err);
    next(err);
  }
};

module.exports = {
  getParkingLogs,
};
