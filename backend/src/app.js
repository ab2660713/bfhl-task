const cors = require("cors");
const express = require("express");
const ticketRoutes = require("./routes/tickets");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(",") || "*"
}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/tickets", ticketRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
