import { useEffect, useState } from "react";
import {
  ArrowDown,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Package,
  Phone,
  Truck,
  UserRound,
} from "lucide-react";
import { api } from "./api";
import type { Assignment, Courier, History, Order, Role } from "./types";
import {
  Badge,
  date,
  labels,
  Modal,
  nextStatus,
  Spinner,
  trackingId,
} from "./ui";

export default function OrderDetail({
  order,
  role,
  couriers,
  close,
  updated,
  notify,
}: {
  order: Order;
  role: Role;
  couriers: Courier[];
  close: () => void;
  updated: () => Promise<void>;
  notify: (text: string) => void;
}) {
  const [history, setHistory] = useState<History[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(role !== "courier");
  const [historyError, setHistoryError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const [courier, setCourier] = useState("");
  const prefix =
    role === "admin"
      ? "/admin/orders"
      : role === "courier"
        ? "/courier/orders"
        : "/orders";
  useEffect(() => {
    if (role === "courier") return;
    let active = true;
    async function load() {
      setLoading(true);
      setHistoryError("");
      try {
        const [h, a] = await Promise.all([
          api<History[]>(`${prefix}/${order.id}/history`),
          role === "admin"
            ? api<Assignment[]>(`${prefix}/${order.id}/assignments`)
            : Promise.resolve([]),
        ]);
        if (active) {
          setHistory(h || []);
          setAssignments(a || []);
        }
      } catch (e) {
        if (active) setHistoryError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [order.id, order.updated_at, order.courier_id, role, prefix]);
  async function action(
    path: string,
    method: string,
    body: unknown,
    success: string,
    shouldClose = false,
  ) {
    setBusy(true);
    setError("");
    try {
      await api(`${prefix}/${order.id}${path}`, method, body);
      await updated();
      notify(success);
      setConfirm(null);
      setCourier("");
      if (shouldClose) close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const next = nextStatus[order.status];
  const canProgress =
    role === "admin" ||
    (role === "courier" && order.assignment_status === "accepted");
  const steps = ["pending", "picked_up", "in_transit", "delivered"] as const;
  return (
    <Modal
      title={trackingId(order.id)}
      subtitle="Shipment details"
      close={close}
      wide
    >
      <div className="detail-summary">
        <Badge status={order.status} />
        <span>
          <CalendarDays size={14} /> Due {date(order.delivery_time, true)}
        </span>
      </div>
      {order.status !== "cancelled" && (
        <div className="tracking-steps">
          {steps.map((step, i) => (
            <div
              key={step}
              className={
                i <= steps.indexOf(order.status as (typeof steps)[number])
                  ? "step complete"
                  : "step"
              }
            >
              <span>
                {i < steps.indexOf(order.status as (typeof steps)[number]) ? (
                  <Check size={13} />
                ) : (
                  i + 1
                )}
              </span>
              <small>{labels[step]}</small>
            </div>
          ))}
        </div>
      )}
      <div className="detail-grid">
        <section className="detail-card">
          <h3>
            <MapPin size={16} /> Delivery route
          </h3>
          <div className="route-detail">
            <span className="route-point" />
            <div>
              <small>PICKUP</small>
              <p>{order.pickup_location}</p>
            </div>
          </div>
          <div className="route-connector">
            <ArrowDown size={14} />
          </div>
          <div className="route-detail">
            <span className="route-point destination" />
            <div>
              <small>DELIVERY</small>
              <p>{order.dropoff_location}</p>
            </div>
          </div>
        </section>
        <section className="detail-card">
          <h3>
            <Package size={16} /> Package information
          </h3>
          <p className="whitespace-pre-wrap">{order.package_details}</p>
          <div className="detail-meta">
            <Clock3 size={14} />
            <span>
              {role === "courier" ? "Assigned" : "Created"}{" "}
              {date(order.created_at, true)}
            </span>
          </div>
        </section>
      </div>
      <div className="detail-grid">
        <section className="detail-card">
          <h3>
            <UserRound size={16} /> Customer
          </h3>
          <p className="font-semibold">{order.customer_name}</p>
          {order.customer_email && (
            <p className="text-muted break-all">{order.customer_email}</p>
          )}
          {order.customer_phone && (
            <a className="contact-link" href={`tel:${order.customer_phone}`}>
              <Phone size={13} />
              {order.customer_phone}
            </a>
          )}
        </section>
        <section className="detail-card">
          <h3>
            <Truck size={16} /> Courier
          </h3>
          <p className="font-semibold">
            {order.courier_name || "Awaiting assignment"}
          </p>
          {order.courier_phone ? (
            <a className="contact-link" href={`tel:${order.courier_phone}`}>
              <Phone size={13} />
              {order.courier_phone}
            </a>
          ) : (
            <p className="text-muted">
              A courier will be assigned to this shipment.
            </p>
          )}
          {order.assignment_status && (
            <p className="text-muted capitalize mt-2">
              Assignment {order.assignment_status}
            </p>
          )}
        </section>
      </div>
      {role === "admin" && order.status === "pending" && (
        <section className="detail-card mb-4">
          <h3>
            <Truck size={16} />{" "}
            {order.courier_id ? "Reassign courier" : "Assign a courier"}
          </h3>
          <div className="flex gap-3 flex-wrap">
            <select
              aria-label="Choose a courier"
              className="flex-1 min-w-40"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
            >
              <option value="">Choose a courier</option>
              {couriers
                .filter((c) => c.id !== order.courier_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <button
              disabled={busy || !courier}
              className="button button-primary"
              onClick={() =>
                void action(
                  "/courier",
                  "PUT",
                  { courier_id: Number(courier) },
                  "Courier assigned.",
                )
              }
            >
              Assign courier
            </button>
          </div>
          {couriers.length === 0 && (
            <p className="field-help">
              No couriers are available in the directory.
            </p>
          )}
        </section>
      )}
      {role !== "courier" && (
        <section className="history-section">
          <h3>Shipment activity</h3>
          {loading ? (
            <div className="py-4">
              <Spinner />
            </div>
          ) : historyError ? (
            <p className="error-message" role="alert">
              {historyError}
            </p>
          ) : (
            <div className="timeline">
              {[...history]
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                .map((h) => (
                  <div className="timeline-item" key={h.id}>
                    <span
                      className={`timeline-dot ${h.new_status === "delivered" ? "delivered" : ""}`}
                    />
                    <div>
                      <p>{labels[h.new_status]}</p>
                      <small>
                        {h.changed_by_name} · {date(h.created_at, true)}
                      </small>
                    </div>
                  </div>
                ))}
              <div className="timeline-item">
                <span className="timeline-dot" />
                <div>
                  <p>Shipment created</p>
                  <small>
                    {order.customer_name} · {date(order.created_at, true)}
                  </small>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
      {role === "admin" && assignments.length > 0 && (
        <section className="history-section">
          <h3>Courier assignments</h3>
          {assignments.map((a) => (
            <div className="assignment-row" key={a.id}>
              <div>
                <p>{a.courier_name}</p>
                <small>{date(a.assigned_at, true)}</small>
              </div>
              <span className="assignment-status">{a.assignment_status}</span>
            </div>
          ))}
        </section>
      )}
      {error && (
        <div className="error-message mt-4" role="alert">
          {error}
        </div>
      )}
      {confirm ? (
        <div className="confirm-box">
          <p>
            {confirm === "delete"
              ? "Permanently delete this shipment and its history?"
              : "Cancel this shipment? This cannot be undone."}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              disabled={busy}
              className="button button-danger"
              onClick={() =>
                void action(
                  confirm === "delete" ? "" : "/cancel",
                  confirm === "delete" ? "DELETE" : "PATCH",
                  undefined,
                  confirm === "delete"
                    ? "Shipment deleted."
                    : "Shipment cancelled.",
                  true,
                )
              }
            >
              {busy ? <Spinner /> : `Yes, ${confirm} shipment`}
            </button>
            <button
              disabled={busy}
              className="button button-secondary"
              onClick={() => setConfirm(null)}
            >
              Keep shipment
            </button>
          </div>
        </div>
      ) : (
        <div className="detail-actions">
          {role === "admin" && (
            <button
              className="danger-link"
              disabled={busy}
              onClick={() => setConfirm("delete")}
            >
              Delete shipment
            </button>
          )}
          {(role === "user" || role === "admin") &&
            order.status === "pending" && (
              <button
                className="button button-secondary"
                disabled={busy}
                onClick={() => setConfirm("cancel")}
              >
                Cancel shipment
              </button>
            )}
          {role === "courier" &&
            order.assignment_status === "pending" &&
            order.status === "pending" && (
              <>
                <button
                  disabled={busy}
                  className="button button-secondary"
                  onClick={() =>
                    void action(
                      "/decline",
                      "PATCH",
                      undefined,
                      "Assignment declined.",
                      true,
                    )
                  }
                >
                  Decline
                </button>
                <button
                  disabled={busy}
                  className="button button-primary"
                  onClick={() =>
                    void action(
                      "/accept",
                      "PATCH",
                      undefined,
                      "Assignment accepted.",
                    )
                  }
                >
                  {busy ? <Spinner /> : "Accept assignment"}
                </button>
              </>
            )}
          {canProgress && next && (
            <button
              disabled={busy}
              className="button button-primary"
              onClick={() =>
                void action(
                  "/status",
                  "PATCH",
                  { status: next },
                  `Shipment marked ${labels[next].toLowerCase()}.`,
                )
              }
            >
              {busy ? <Spinner /> : `Mark as ${labels[next].toLowerCase()}`}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
