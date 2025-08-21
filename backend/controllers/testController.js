const testService = require('../services/testService');

const testDB = async (req, res) => {
  try {
    const result = await testService.testDBConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  testDB,
};
