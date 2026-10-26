import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Truck,
  Users,
  X,
} from "lucide-react";
import Auth from "./Auth";
import CreateOrder from "./CreateOrder";
import OrderDetail from "./OrderDetail";
import { api, ApiError } from "./api";
import {
  Badge,
  Brand,
  date,
  Empty,
  labels,
  Spinner,
  statuses,
  trackingId,
} from "./ui";
import type { Courier, CourierOrder, Order, Status, User } from "./types";

type Page = "overview" | "shipments" | "couriers" | "account";
const pageSize = 8;
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [expired, setExpired] = useState(false);
  const [page, setPage] = useState<Page>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all" | "moving">("all");
  const [index, setIndex] = useState(1);
  const [create, setCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const closeDetail = useCallback(() => setSelectedId(null), []);
  const closeCreate = useCallback(() => setCreate(false), []);
  const notify = useCallback((text: string) => setToast(text), []);

  useEffect(() => {
    let active = true;
    // Remove credentials left by the previous bearer-based frontend.
    sessionStorage.removeItem("parcel_token");
    api<User>("/auth/me", "GET", undefined, { allowGuest: true })
      .then((u) => {
        if (active) setUser(u);
      })
      .catch((e) => {
        if (active && !(e instanceof ApiError && e.status === 401))
          setError((e as Error).message);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const expire = () => {
      setUser(null);
      setOrders([]);
      setCouriers([]);
      setSelectedId(null);
      setCreate(false);
      setExpired(true);
    };
    window.addEventListener("parcel:expired", expire);
    return () => window.removeEventListener("parcel:expired", expire);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      if (user.role === "courier") {
        const assignments = await api<CourierOrder[]>("/courier/orders");
        setOrders(
          (assignments || []).map((a) => ({
            ...a,
            id: a.order_id,
            status: a.order_status,
            created_at: a.assigned_at,
            updated_at: `${a.order_status}-${a.assignment_status}`,
          })),
        );
      } else {
        const [data, directory] = await Promise.all([
          api<Order[]>(user.role === "admin" ? "/admin/orders" : "/orders"),
          user.role === "admin"
            ? api<Courier[]>("/admin/couriers")
            : Promise.resolve([]),
        ]);
        setOrders(data || []);
        setCouriers(directory || []);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    setIndex(1);
  }, [query, status, page]);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (status === "all" ||
            (status === "moving"
              ? ["picked_up", "in_transit"].includes(o.status)
              : o.status === status)) &&
          [
            trackingId(o.id),
            o.pickup_location,
            o.dropoff_location,
            o.package_details,
            o.customer_name,
            o.courier_name,
          ].some((v) => v?.toLowerCase().includes(query.toLowerCase().trim())),
      ),
    [orders, status, query],
  );
  const selected = orders.find((o) => o.id === selectedId);
  const activeCount = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status),
  ).length;
  const transitCount = orders.filter((o) =>
    ["picked_up", "in_transit"].includes(o.status),
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const safeIndex = Math.min(
    index,
    Math.max(1, Math.ceil(filtered.length / pageSize)),
  );
  const shown =
    page === "overview"
      ? orders.slice(0, 5)
      : filtered.slice((safeIndex - 1) * pageSize, safeIndex * pageSize);
  const navigate = (next: Page) => {
    setPage(next);
    setMobileNav(false);
    setQuery("");
    setStatus("all");
  };
  function openFilter(value: Status | "all" | "moving") {
    setStatus(value);
    setPage("shipments");
    setQuery("");
  }
  async function logout() {
    setLoggingOut(true);
    try {
      await api("/auth/logout", "POST");
      setUser(null);
      setOrders([]);
      setCouriers([]);
      setPage("overview");
      setExpired(false);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setLoggingOut(false);
    }
  }
  function login(u: User) {
    setUser(u);
    setError("");
    setExpired(false);
    setPage("overview");
  }
  if (initializing)
    return (
      <div className="loading-screen">
        <Brand />
        <Spinner />
      </div>
    );
  if (!user) return <Auth onLogin={login} expired={expired} />;
  const role = user.role;
  const nav = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    {
      id: "shipments" as const,
      label: role === "courier" ? "My deliveries" : "Shipments",
      icon: Package,
    },
    ...(role === "admin"
      ? [{ id: "couriers" as const, label: "Couriers", icon: Users }]
      : []),
  ];

  return (
    <div className="app-shell">
      {mobileNav && (
        <div className="sidebar-scrim" onClick={() => setMobileNav(false)} />
      )}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-avatar">
            {role === "admin" ? "OP" : role === "courier" ? "CO" : "MY"}
          </span>
          <div>
            <strong>
              {role === "admin"
                ? "Operations workspace"
                : role === "courier"
                  ? "Courier workspace"
                  : "Personal workspace"}
            </strong>
            <small>
              {role === "admin"
                ? "Manage every mile"
                : role === "courier"
                  ? "Make every mile count"
                  : "Your deliveries, connected"}
            </small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={19} strokeWidth={1.7} />
              <span>{item.label}</span>
              {item.id === "shipments" && activeCount > 0 && (
                <span className="nav-count">{activeCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">
              <RouteIcon />
            </span>
            <strong>A clear path ahead.</strong>
            <p>
              {role === "admin"
                ? "Assign a courier, follow the journey, and keep every delivery moving."
                : role === "courier"
                  ? "Accept your assignments, then update each delivery along the way."
                  : "From pickup to doorstep, follow every step of your shipment."}
            </p>
          </div>
          <button
            className={`nav-item ${page === "account" ? "active" : ""}`}
            onClick={() => navigate("account")}
          >
            <Settings2 size={18} />
            <span>My account</span>
          </button>
          <div className="sidebar-profile">
            <div className="avatar">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="truncate block">{user.name}</strong>
              <small>
                {role === "user"
                  ? "Customer"
                  : role === "admin"
                    ? "Administrator"
                    : "Courier"}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Sign out"
              disabled={loggingOut}
              onClick={() => void logout()}
            >
              {loggingOut ? <Spinner /> : <LogOut size={17} />}
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="icon-button mobile-only"
              aria-label="Open menu"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={13} />{" "}
              <strong>
                {page === "overview"
                  ? "Overview"
                  : page === "shipments"
                    ? role === "courier"
                      ? "My deliveries"
                      : "Shipments"
                    : page === "couriers"
                      ? "Couriers"
                      : "My account"}
              </strong>
            </span>
          </div>
          <div className="topbar-date">
            <CalendarDays size={15} />
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "overview"
                  ? "A LITTLE CLARITY FOR YOUR DAY"
                  : page === "shipments"
                    ? "FROM PICKUP TO DOORSTEP"
                    : page === "couriers"
                      ? "THE PEOPLE KEEPING THINGS MOVING"
                      : "YOUR PERSONAL SPACE"}
              </div>
              <h1>
                {page === "overview"
                  ? `Welcome back, ${user.name.split(" ")[0]}.`
                  : page === "shipments"
                    ? role === "courier"
                      ? "Your deliveries"
                      : "Your shipments"
                    : page === "couriers"
                      ? "Courier directory"
                      : "My account"}
              </h1>
              <p>
                {page === "overview"
                  ? role === "admin"
                    ? "Here’s what’s moving across your delivery network."
                    : "Here’s a clear view of your delivery journey."
                  : page === "shipments"
                    ? role === "courier"
                      ? "Your assigned routes, ready for the next step."
                      : "Every package, every update. All in one place."
                    : page === "couriers"
                      ? "Find the right person for the next delivery."
                      : "The details that keep you connected."}
              </p>
            </div>
            <div className="heading-actions">
              {page !== "account" && (
                <button
                  className="button button-secondary refresh-button"
                  disabled={loading}
                  onClick={() => void load()}
                  aria-label="Refresh data"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  <span>Refresh</span>
                </button>
              )}
              {role === "user" && page !== "account" && (
                <button
                  className="button button-primary"
                  onClick={() => setCreate(true)}
                >
                  <Plus size={17} /> New shipment
                </button>
              )}
            </div>
          </div>
          {error && (
            <div
              className="error-message mb-6 flex items-center justify-between gap-4"
              role="alert"
            >
              <span>{error}</span>
              <button
                className="text-link shrink-0"
                onClick={() => void load()}
              >
                Try again
              </button>
            </div>
          )}
          {(page === "overview" || page === "shipments") && (
            <>
              <section className="stats-grid" aria-label="Shipment statistics">
                {[
                  {
                    label: "Total shipments",
                    value: orders.length,
                    icon: Box,
                    sub:
                      role === "courier"
                        ? "Your assigned shipments"
                        : "Every journey, in one view",
                    filter: "all" as const,
                    tone: "slate",
                  },
                  {
                    label: "In transit",
                    value: transitCount,
                    icon: Truck,
                    sub: "Picked up & on the move",
                    filter: "moving" as const,
                    tone: "blue",
                  },
                  {
                    label: "Delivered",
                    value: deliveredCount,
                    icon: CheckCheck,
                    sub: "Safely at their destination",
                    filter: "delivered" as const,
                    tone: "green",
                  },
                  {
                    label: "Pending pickup",
                    value: pendingCount,
                    icon: ClockIcon,
                    sub: "Getting ready for the journey",
                    filter: "pending" as const,
                    tone: "amber",
                  },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    className={`stat-card stat-${stat.tone}`}
                    onClick={() => openFilter(stat.filter)}
                  >
                    <div className="stat-top">
                      <span>{stat.label}</span>
                      <span className="stat-icon">
                        <stat.icon size={19} strokeWidth={1.7} />
                      </span>
                    </div>
                    <strong>
                      {loading && orders.length === 0
                        ? "—"
                        : String(stat.value).padStart(2, "0")}
                    </strong>
                    <p>
                      {stat.sub}
                      <ArrowUpRight size={13} />
                    </p>
                  </button>
                ))}
              </section>
              {page === "overview" && (
                <section className="overview-banner">
                  <div className="banner-copy">
                    <span className="eyebrow">EVERY MILE MATTERS</span>
                    <h2>
                      {role === "admin"
                        ? "Keep good things moving."
                        : role === "courier"
                          ? "Your next stop starts here."
                          : "Big or small. Send it with care."}
                    </h2>
                    <p>
                      {role === "admin"
                        ? `${orders.filter((o) => o.status === "pending" && !o.courier_id).length} shipments are waiting for a courier. Give their journey a start.`
                        : role === "courier"
                          ? `${orders.filter((o) => o.assignment_status === "pending" && o.status === "pending").length} new assignments are waiting for your response.`
                          : "A doorstep surprise. A business essential. We’re here for the journey."}
                    </p>
                    <button
                      onClick={() =>
                        role === "user"
                          ? setCreate(true)
                          : openFilter("pending")
                      }
                    >
                      {role === "user"
                        ? "Create a shipment"
                        : role === "courier"
                          ? "View assignments"
                          : "Manage pending shipments"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="banner-art" aria-hidden="true">
                    <div className="banner-ring" />
                    <div className="mini-route">
                      <span />
                      <i />
                      <span />
                    </div>
                    <div className="banner-package">
                      <Package size={64} strokeWidth={1} />
                    </div>
                    <div className="banner-sticker">
                      <Check size={18} /> Handle with care
                    </div>
                  </div>
                </section>
              )}
              <section className="shipments-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {page === "overview"
                        ? "Recent shipments"
                        : role === "courier"
                          ? "Delivery list"
                          : "Shipment list"}{" "}
                      <span className="count-chip">
                        {page === "overview" ? orders.length : filtered.length}
                      </span>
                    </h2>
                    <p>
                      {page === "overview"
                        ? "The latest updates, without the guesswork."
                        : "Select a shipment to see the full journey."}
                    </p>
                  </div>
                  {page === "overview" && (
                    <button
                      className="text-link"
                      onClick={() => navigate("shipments")}
                    >
                      View all shipments <ArrowRight size={15} />
                    </button>
                  )}
                </div>
                {page === "shipments" && (
                  <div className="table-tools">
                    <div className="search-input">
                      <Search size={17} />
                      <input
                        aria-label="Search shipments"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search ID, address, or name…"
                      />
                      {query && (
                        <button
                          className="icon-button"
                          aria-label="Clear search"
                          onClick={() => setQuery("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <select
                      aria-label="Filter by shipment status"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as Status | "all" | "moving")
                      }
                    >
                      <option value="all">All statuses</option>
                      <option value="moving">On the move</option>
                      {statuses.map((s) => (
                        <option value={s} key={s}>
                          {labels[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {loading && orders.length === 0 ? (
                  <div className="table-loading">
                    <Spinner />
                    <span>Loading your shipments…</span>
                  </div>
                ) : shown.length === 0 ? (
                  <Empty
                    title={
                      orders.length
                        ? "No matching shipments"
                        : "Your next journey starts here."
                    }
                    action={
                      orders.length ? (
                        <button
                          className="button button-secondary"
                          onClick={() => {
                            setQuery("");
                            setStatus("all");
                          }}
                        >
                          Clear filters
                        </button>
                      ) : role === "user" ? (
                        <button
                          className="button button-primary"
                          onClick={() => setCreate(true)}
                        >
                          <Plus size={16} /> Create your first shipment
                        </button>
                      ) : undefined
                    }
                  >
                    {orders.length
                      ? "Try a different search or status filter."
                      : role === "admin"
                        ? "New customer shipments will appear here, ready to assign and track."
                        : role === "courier"
                          ? "Your assigned deliveries will appear here when they’re ready."
                          : "Book a shipment and follow it from pickup to doorstep."}
                  </Empty>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>SHIPMENT</th>
                          <th>ROUTE</th>
                          <th>{role === "admin" ? "CUSTOMER" : "COURIER"}</th>
                          <th>DELIVERY TIME</th>
                          <th>STATUS</th>
                          <th aria-label="View shipment" />
                        </tr>
                      </thead>
                      <tbody>
                        {shown.map((o) => (
                          <tr key={o.id}>
                            <td>
                              <button
                                className="shipment-id"
                                onClick={() => setSelectedId(o.id)}
                              >
                                <span className="table-package">
                                  <Package size={18} strokeWidth={1.5} />
                                </span>
                                <span>
                                  <strong>{trackingId(o.id)}</strong>
                                  <small>{date(o.created_at)}</small>
                                </span>
                              </button>
                            </td>
                            <td>
                              <div className="table-route">
                                <span>
                                  <i />
                                  {o.pickup_location}
                                </span>
                                <span>
                                  <i />
                                  {o.dropoff_location}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="person-cell">
                                {role === "admin"
                                  ? o.customer_name
                                  : o.courier_name || (
                                      <span className="text-muted">
                                        Unassigned
                                      </span>
                                    )}
                              </div>
                              {role === "courier" &&
                                o.assignment_status === "pending" &&
                                o.status === "pending" && (
                                  <small className="awaiting">
                                    Awaiting your response
                                  </small>
                                )}
                            </td>
                            <td>
                              <span className="delivery-date">
                                {date(o.delivery_time)}
                              </span>
                              <small className="table-time">
                                {new Date(o.delivery_time).toLocaleTimeString(
                                  "en-GB",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </small>
                            </td>
                            <td>
                              <Badge status={o.status} />
                            </td>
                            <td>
                              <button
                                className="icon-button"
                                aria-label={`View ${trackingId(o.id)}`}
                                onClick={() => setSelectedId(o.id)}
                              >
                                <ArrowUpRight size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    {page === "overview"
                      ? `Showing ${shown.length} of ${orders.length} shipments`
                      : filtered.length
                        ? `Showing ${(safeIndex - 1) * pageSize + 1}–${Math.min(safeIndex * pageSize, filtered.length)} of ${filtered.length} shipments`
                        : "0 shipments"}
                  </span>
                  {page === "shipments" ? (
                    <div className="pagination">
                      <button
                        className="icon-button"
                        aria-label="Previous page"
                        disabled={safeIndex <= 1}
                        onClick={() => setIndex(safeIndex - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span>
                        {safeIndex} /{" "}
                        {Math.max(1, Math.ceil(filtered.length / pageSize))}
                      </span>
                      <button
                        className="icon-button"
                        aria-label="Next page"
                        disabled={safeIndex * pageSize >= filtered.length}
                        onClick={() => setIndex(safeIndex + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="live-note">
                      <span /> Connected to your workspace
                    </span>
                  )}
                </div>
              </section>
              {page === "overview" && (
                <div className="overview-footnote">
                  <CircleHelp size={15} />
                  <span>
                    {role === "user"
                      ? "A change of plans? You can cancel a shipment before it’s picked up."
                      : role === "admin"
                        ? "Couriers can be assigned or reassigned while a shipment is pending."
                        : "Accept an assignment before updating its delivery status."}
                  </span>
                </div>
              )}
            </>
          )}
          {page === "couriers" && (
            <section className="shipments-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    Your delivery team{" "}
                    <span className="count-chip">{couriers.length}</span>
                  </h2>
                  <p>Courier contact details and current workload.</p>
                </div>
              </div>
              <div className="courier-grid">
                {couriers.map((c, i) => {
                  const assigned = orders.filter(
                    (o) =>
                      o.courier_id === c.id &&
                      !["delivered", "cancelled"].includes(o.status),
                  ).length;
                  return (
                    <article className="courier-card" key={c.id}>
                      <div className="flex items-center justify-between">
                        <span className={`courier-avatar color-${i % 3}`}>
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <Truck size={20} className="text-muted" />
                      </div>
                      <h3>{c.name}</h3>
                      <p>{c.email}</p>
                      <a href={`tel:${c.phone}`}>{c.phone}</a>
                      <div className="courier-workload">
                        <span>Active shipments</span>
                        <strong>{assigned}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!loading && !couriers.length && (
                <Empty title="No couriers yet">
                  Couriers will appear here once added to the system.
                </Empty>
              )}
            </section>
          )}
          {page === "account" && (
            <section className="account-card">
              <div className="account-cover" />
              <div className="account-content">
                <div className="account-avatar">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <span className="role-chip">
                  {role === "user"
                    ? "Customer"
                    : role === "admin"
                      ? "Administrator"
                      : "Courier"}
                </span>
                <h2>{user.name}</h2>
                <p className="text-muted">
                  Your Tools Project account details.
                </p>
                <dl>
                  <div>
                    <dt>Full name</dt>
                    <dd>{user.name}</dd>
                  </div>
                  <div>
                    <dt>Email address</dt>
                    <dd>{user.email || "—"}</dd>
                  </div>
                  <div>
                    <dt>Phone number</dt>
                    <dd>{user.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt>Member since</dt>
                    <dd>{date(user.created_at)}</dd>
                  </div>
                </dl>
                <p className="account-note">
                  Your account is connected to the{" "}
                  {role === "admin"
                    ? "operations"
                    : role === "courier"
                      ? "courier"
                      : "customer"}{" "}
                  workspace.
                </p>
              </div>
            </section>
          )}
          <footer className="page-footer">
            <span>
              Thoughtfully delivered.<strong> Tools Project.</strong>
            </span>
            <span>ONE JOURNEY AT A TIME</span>
          </footer>
        </main>
      </div>
      {create && (
        <CreateOrder
          close={closeCreate}
          created={() => {
            setCreate(false);
            notify("Shipment created. A new journey begins.");
            void load();
          }}
        />
      )}
      {selected && (
        <OrderDetail
          order={selected}
          role={role}
          couriers={couriers}
          close={closeDetail}
          updated={load}
          notify={notify}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={16} />
          </span>
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function RouteIcon() {
  return (
    <div className="flex items-center gap-0.5">
      <MapPin size={17} />
      <ArrowRight size={12} />
      <MapPin size={17} />
    </div>
  );
}
function ClockIcon({
  size = 19,
  strokeWidth = 1.7,
}: {
  size?: number;
  strokeWidth?: number;
}) {
  return <ArrowDownLeft size={size} strokeWidth={strokeWidth} />;
}
