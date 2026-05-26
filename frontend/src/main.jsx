import React from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, ArrowLeft, ArrowRight, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" }
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

const EMPTY_FORM = {
  subject: "",
  description: "",
  customerEmail: "",
  priority: "medium"
};

function buildUrl(path, params = {}) {
  const url = new URL(path, API_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== false && value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function formatAge(minutes) {
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours < 24) return `${hours}h ${mins}m`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

function getAdjacentStatuses(status) {
  const index = STATUSES.findIndex((item) => item.value === status);
  return {
    prev: index > 0 ? STATUSES[index - 1] : null,
    next: index < STATUSES.length - 1 ? STATUSES[index + 1] : null
  };
}

function groupTickets(tickets) {
  return STATUSES.reduce((groups, status) => {
    groups[status.value] = tickets.filter((ticket) => ticket.status === status.value);
    return groups;
  }, {});
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="field-error">{children}</p>;
}

function StatsStrip({ stats }) {
  const counts = stats?.byStatus || {};

  return (
    <section className="stats-strip" aria-label="Ticket statistics">
      {STATUSES.map((status) => (
        <div className="stat" key={status.value}>
          <span>{status.label}</span>
          <strong>{counts[status.value] || 0}</strong>
        </div>
      ))}
      <div className="stat breached">
        <span>Breached Open</span>
        <strong>{stats?.breachedOpen || 0}</strong>
      </div>
    </section>
  );
}

function Filters({ filters, onChange, onRefresh, loading }) {
  return (
    <div className="filters">
      <label>
        Priority
        <select
          value={filters.priority}
          onChange={(event) => onChange({ ...filters, priority: event.target.value })}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </label>

      <label className="toggle">
        <input
          type="checkbox"
          checked={filters.breached}
          onChange={(event) => onChange({ ...filters, breached: event.target.checked })}
        />
        SLA breached only
      </label>

      <button className="icon-button" type="button" onClick={onRefresh} title="Refresh tickets" disabled={loading}>
        {loading ? <LoaderCircle className="spin" size={18} /> : <RefreshCw size={18} />}
      </button>
    </div>
  );
}

function TicketCard({ ticket, onMove, onDelete, busyId }) {
  const { prev, next } = getAdjacentStatuses(ticket.status);
  const busy = busyId === ticket._id;

  return (
    <article className={`ticket-card priority-${ticket.priority}`}>
      <div className="ticket-topline">
        <span className={`badge ${ticket.priority}`}>{ticket.priority}</span>
        {ticket.slaBreached && (
          <span className="sla-badge" title="SLA breached">
            <AlertTriangle size={14} />
            SLA
          </span>
        )}
      </div>

      <h3>{ticket.subject}</h3>
      <p>{ticket.customerEmail}</p>

      <div className="ticket-meta">
        <span>{formatAge(ticket.ageMinutes)}</span>
        <span>{ticket.status.replace("_", " ")}</span>
      </div>

      <div className="card-actions">
        {prev && (
          <button type="button" onClick={() => onMove(ticket, prev.value)} disabled={busy} title={`Move to ${prev.label}`}>
            <ArrowLeft size={16} />
            {prev.label}
          </button>
        )}
        {next && (
          <button type="button" onClick={() => onMove(ticket, next.value)} disabled={busy} title={`Move to ${next.label}`}>
            {next.label}
            <ArrowRight size={16} />
          </button>
        )}
        <button className="danger-icon" type="button" onClick={() => onDelete(ticket)} disabled={busy} title="Delete ticket">
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

function Board({ tickets, onMove, onDelete, busyId }) {
  const grouped = groupTickets(tickets);

  return (
    <section className="board" aria-label="Ticket board">
      {STATUSES.map((status) => (
        <div className="column" key={status.value}>
          <div className="column-header">
            <h2>{status.label}</h2>
            <span>{grouped[status.value].length}</span>
          </div>

          <div className="ticket-list">
            {grouped[status.value].length === 0 ? (
              <p className="empty-column">No tickets</p>
            ) : (
              grouped[status.value].map((ticket) => (
                <TicketCard
                  key={ticket._id}
                  ticket={ticket}
                  onMove={onMove}
                  onDelete={onDelete}
                  busyId={busyId}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

function CreateTicketForm({ onCreate }) {
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);

  function validate() {
    const nextErrors = {};
    if (!form.subject.trim()) nextErrors.subject = "Subject is required";
    if (!form.description.trim()) nextErrors.description = "Description is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      nextErrors.customerEmail = "Enter a valid customer email";
    }
    if (!PRIORITIES.includes(form.priority)) nextErrors.priority = "Choose a priority";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      await onCreate(form);
      setForm(EMPTY_FORM);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <div className="section-heading">
        <Plus size={20} />
        <h2>Create Ticket</h2>
      </div>

      <FieldError>{errors.form}</FieldError>

      <label>
        Subject
        <input value={form.subject} onChange={(event) => updateField("subject", event.target.value)} />
        <FieldError>{errors.subject}</FieldError>
      </label>

      <label>
        Description
        <textarea rows="4" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
        <FieldError>{errors.description}</FieldError>
      </label>

      <label>
        Customer Email
        <input value={form.customerEmail} onChange={(event) => updateField("customerEmail", event.target.value)} />
        <FieldError>{errors.customerEmail}</FieldError>
      </label>

      <label>
        Priority
        <select value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
        <FieldError>{errors.priority}</FieldError>
      </label>

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create ticket"}
      </button>
    </form>
  );
}

function App() {
  const [tickets, setTickets] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [filters, setFilters] = React.useState({ priority: "", breached: false });
  const [loading, setLoading] = React.useState(true);
  const [pageError, setPageError] = React.useState("");
  const [actionError, setActionError] = React.useState("");
  const [busyId, setBusyId] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const [nextTickets, nextStats] = await Promise.all([
        fetch(buildUrl("/tickets", {
          priority: filters.priority,
          breached: filters.breached ? "true" : undefined
        })).then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not load tickets");
          return data;
        }),
        request("/tickets/stats")
      ]);

      setTickets(nextTickets);
      setStats(nextStats);
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  async function moveTicket(ticket, status) {
    setBusyId(ticket._id);
    setActionError("");

    try {
      await request(`/tickets/${ticket._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function deleteTicket(ticket) {
    setBusyId(ticket._id);
    setActionError("");

    try {
      await request(`/tickets/${ticket._id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function createTicket(payload) {
    await request("/tickets", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    await loadData();
  }

  return (
    <main>
      <header className="app-header">
        <div>
          <p>Support Ticket Triage</p>
          <h1>DeskFlow</h1>
        </div>
        <StatsStrip stats={stats} />
      </header>

      <section className="workspace">
        <div className="board-panel">
          <div className="toolbar">
            <div>
              <h2>Ticket Board</h2>
              <p>{tickets.length} tickets shown</p>
            </div>
            <Filters filters={filters} onChange={setFilters} onRefresh={loadData} loading={loading} />
          </div>

          {pageError && <p className="notice error">{pageError}</p>}
          {actionError && <p className="notice warning">{actionError}</p>}
          {loading ? (
            <div className="loading-state">
              <LoaderCircle className="spin" />
              Loading tickets
            </div>
          ) : (
            <Board tickets={tickets} onMove={moveTicket} onDelete={deleteTicket} busyId={busyId} />
          )}
        </div>

        <aside>
          <CreateTicketForm onCreate={createTicket} />
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
