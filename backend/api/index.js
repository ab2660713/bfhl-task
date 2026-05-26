const app = require("../src/app");
const connectDb = require("../src/config/db");

let dbConnection;

module.exports = async (req, res) => {
  try {
    dbConnection = dbConnection || connectDb();
    await dbConnection;
    return app(req, res);
  } catch (err) {
    console.error("API startup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
