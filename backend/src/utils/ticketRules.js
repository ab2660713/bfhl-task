const STATUS_ORDER = ["open", "in_progress", "resolved", "closed"];

const SLA_TARGET_MINUTES = {
  urgent: 60,
  high: 240,
  medium: 1440,
  low: 4320
};

function getTicketAgeMinutes(ticket, now = new Date()) {
  const end = ticket.resolvedAt || now;
  return Math.max(0, Math.floor((end.getTime() - ticket.createdAt.getTime()) / 60000));
}

function isSlaBreached(ticket, now = new Date()) {
  const target = SLA_TARGET_MINUTES[ticket.priority];
  if (!target) return false;

  return getTicketAgeMinutes(ticket, now) > target;
}

function formatTicket(ticket, now = new Date()) {
  const raw = typeof ticket.toObject === "function" ? ticket.toObject() : ticket;

  return {
    ...raw,
    ageMinutes: getTicketAgeMinutes(ticket, now),
    slaBreached: isSlaBreached(ticket, now)
  };
}

function validateStatusTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) {
    return null;
  }

  const fromIndex = STATUS_ORDER.indexOf(fromStatus);
  const toIndex = STATUS_ORDER.indexOf(toStatus);

  if (fromIndex === -1 || toIndex === -1) {
    return "Unknown status transition";
  }

  const step = toIndex - fromIndex;
  if (step === 1 || step === -1) {
    return null;
  }

  return `Invalid status transition from ${fromStatus} to ${toStatus}`;
}

module.exports = {
  SLA_TARGET_MINUTES,
  STATUS_ORDER,
  formatTicket,
  getTicketAgeMinutes,
  isSlaBreached,
  validateStatusTransition
};
