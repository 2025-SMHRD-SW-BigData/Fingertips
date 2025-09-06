const db = require('../services/db');

const getParkingLogs = async (parkingIdx) => {
  const hasFilter = Number.isFinite(parkingIdx);
  const sql = hasFilter
    ? `SELECT pl.log_idx, pl.ve_number, v.ve_img, pl.space_id, pl.entry_at, pl.exit_at
         FROM tb_parking_log pl
         JOIN tb_parking_space ps ON ps.space_id = pl.space_id
         LEFT JOIN tb_vehicle v ON pl.ve_number = v.ve_number
        WHERE ps.parking_idx = ?
        ORDER BY pl.entry_at DESC
        LIMIT 5`
    : `SELECT pl.log_idx, pl.ve_number, v.ve_img, pl.space_id, pl.entry_at, pl.exit_at
         FROM tb_parking_log pl
         LEFT JOIN tb_vehicle v ON pl.ve_number = v.ve_number
        ORDER BY pl.entry_at DESC
        LIMIT 5`;
  const params = hasFilter ? [parkingIdx] : [];
  return await db.query(sql, params);
};

module.exports = {
  getParkingLogs,
};
