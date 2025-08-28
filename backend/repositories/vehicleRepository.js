import pool from "../config/database.js";

export const insertVehicle = async (plateNumber, imageUrl) => {
  const sql = "INSERT INTO tb_vehicle (ve_number, ve_img) VALUES (?, ?)";
  const [result] = await pool.execute(sql, [plateNumber, imageUrl]);
  return result.insertId;
};
