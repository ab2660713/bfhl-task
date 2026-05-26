const cors = require("cors");
const express = require("express");
const ticketRoutes = require("./routes/tickets");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  }
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "DeskFlow API",
    status: "ok",
    endpoints: ["/health", "/tickets", "/tickets/stats"]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/tickets", ticketRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
