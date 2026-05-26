const express = require("express");
const { Ticket, PRIORITIES, STATUSES } = require("../models/Ticket");
const { formatTicket, isSlaBreached, validateStatusTransition } = require("../utils/ticketRules");
const { sendError } = require("../middleware/errorHandler");

const router = express.Router();

function pickTicketInput(body) {
  return {
    subject: body.subject,
    description: body.description,
    customerEmail: body.customerEmail,
    priority: body.priority
  };
}

function validateFilters(req, res, next) {
  const { status, priority, breached } = req.query;

  if (status && !STATUSES.includes(status)) {
    return sendError(res, 400, "Status filter must be one of: open, in_progress, resolved, closed");
  }

  if (priority && !PRIORITIES.includes(priority)) {
    return sendError(res, 400, "Priority filter must be one of: low, medium, high, urgent");
  }

  if (breached && breached !== "true" && breached !== "false") {
    return sendError(res, 400, "Breached filter must be true or false");
  }

  return next();
}

router.post("/", async (req, res, next) => {
  try {
    const allowedFields = ["subject", "description", "customerEmail", "priority", "status"];
    const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));

    if (unknownFields.length > 0) {
      return sendError(res, 400, `Unknown field(s): ${unknownFields.join(", ")}`);
    }

    if (req.body.status !== undefined && req.body.status !== "open") {
      return sendError(res, 400, "New tickets must start with status open");
    }

    const ticket = await Ticket.create(pickTicketInput(req.body));
    return res.status(201).json(formatTicket(ticket));
  } catch (err) {
    return next(err);
  }
});

router.get("/", validateFilters, async (req, res, next) => {
  try {
    const query = {};
    const { status, priority, breached } = req.query;

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    const formatted = tickets.map((ticket) => formatTicket(ticket));
    const filtered = breached === undefined
      ? formatted
      : formatted.filter((ticket) => ticket.slaBreached === (breached === "true"));

    return res.json(filtered);
  } catch (err) {
    return next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const tickets = await Ticket.find({});
    const statusCounts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
    const priorityCounts = Object.fromEntries(PRIORITIES.map((priority) => [priority, 0]));
    let breachedOpen = 0;

    for (const ticket of tickets) {
      statusCounts[ticket.status] += 1;
      priorityCounts[ticket.priority] += 1;

      if (ticket.status !== "resolved" && ticket.status !== "closed" && isSlaBreached(ticket)) {
        breachedOpen += 1;
      }
    }

    return res.json({
      byStatus: statusCounts,
      byPriority: priorityCounts,
      breachedOpen
    });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const allowedFields = ["subject", "description", "customerEmail", "priority", "status"];
    const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));

    if (unknownFields.length > 0) {
      return sendError(res, 400, `Unknown field(s): ${unknownFields.join(", ")}`);
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return sendError(res, 404, "Ticket not found");
    }

    if (req.body.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) {
        return sendError(res, 400, "Status must be one of: open, in_progress, resolved, closed");
      }

      const transitionError = validateStatusTransition(ticket.status, req.body.status);
      if (transitionError) {
        return sendError(res, 400, transitionError);
      }

      if (req.body.status === "resolved" && ticket.status !== "resolved") {
        ticket.resolvedAt = new Date();
      }

      if (ticket.status === "resolved" && req.body.status !== "resolved") {
        ticket.resolvedAt = null;
      }

      ticket.status = req.body.status;
    }

    for (const field of ["subject", "description", "customerEmail", "priority"]) {
      if (req.body[field] !== undefined) {
        ticket[field] = req.body[field];
      }
    }

    await ticket.save();
    return res.json(formatTicket(ticket));
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return sendError(res, 404, "Ticket not found");
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
