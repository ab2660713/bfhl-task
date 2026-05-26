require("dotenv").config();

const app = require("./app");
const connectDb = require("./config/db");

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`DeskFlow API listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
