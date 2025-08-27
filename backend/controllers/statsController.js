const db = require('../services/db');

// 위반 유형별 통계 조회 (뷰 활용)
async function getViolationsByType(req, res, next) {
    try {
        const rows = await db.query(`SELECT * FROM V_VIOLATIONS_BY_TYPE`);
        res.json(rows);
    } catch (err) {
        console.error(`Error while getting violation stats by type`, err.message);
        next(err);
    }
}

// 날짜별 위반 통계 조회 (뷰 활용)
async function getViolationsByDate(req, res, next) {
    try {
        const rows = await db.query(`SELECT * FROM V_VIOLATIONS_BY_DATE`);
        res.json(rows);
    } catch (err) {
        console.error(`Error while getting violation stats by date`, err.message);
        next(err);
    }
}

// 장소별 위반 통계 조회 (뷰 활용)
async function getViolationsByLocation(req, res, next) {
    try {
        const rows = await db.query(`SELECT * FROM V_VIOLATIONS_BY_LOCATION`);
        res.json(rows);
    } catch (err) {
        console.error(`Error while getting violation stats by location`, err.message);
        next(err);
    }
}

module.exports = {
    getViolationsByType,
    getViolationsByDate,
    getViolationsByLocation,
};