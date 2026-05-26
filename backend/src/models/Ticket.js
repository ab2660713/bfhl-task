const mongoose = require("mongoose");

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [140, "Subject must be 140 characters or fewer"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description must be 2000 characters or fewer"]
    },
    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Customer email must be valid"]
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: {
        values: PRIORITIES,
        message: "Priority must be one of: low, medium, high, urgent"
      }
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: "Status must be one of: open, in_progress, resolved, closed"
      },
      default: "open"
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = {
  Ticket: mongoose.model("Ticket", ticketSchema),
  PRIORITIES,
  STATUSES
};
