const dashboardRepo = require('../repositories/dashboardRepo');

const getParkingLogs = async (parkingIdx) => {
  return await dashboardRepo.getParkingLogs(parkingIdx);
};

module.exports = {
  getParkingLogs,
};
