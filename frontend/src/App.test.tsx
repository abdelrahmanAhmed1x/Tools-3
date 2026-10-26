import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import type { Order, Role } from "./types";

const shipment: Order = {
  id: 14,
  user_id: 9,
  courier_id: null,
  pickup_location: "12 Garden Street, Cairo",
  dropoff_location: "48 River Road, Giza",
  package_details: "Books, handle with care",
  delivery_time: "2027-11-12T12:00:00Z",
  status: "pending",
  created_at: "2026-10-22T10:00:00Z",
  updated_at: "2026-10-22T10:00:00Z",
  customer_name: "Maya Hassan",
  customer_phone: "01012345678",
  courier_name: null,
  courier_phone: null,
};
function mockServer(role: Role | null, orders: Order[] = [shipment]) {
  let current = orders.map((o) => ({ ...o }));
  let authenticated = role !== null;
  const calls: {
    path: string;
    method: string;
    body: Record<string, unknown>;
  }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.credentials).toBe("include");
      expect(new Headers(init?.headers).has("Authorization")).toBe(false);
      const path = String(url).replace("/api/v1", "");
      const method = init?.method || "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      calls.push({ path, method, body });
      let data: unknown;
      if (path === "/auth/me") {
        if (!authenticated)
          return new Response(
            JSON.stringify({
              success: false,
              error: { message: "authentication required" },
            }),
            { status: 401 },
          );
        data = {
          id: 9,
          name: "Maya Hassan",
          email: "maya@example.test",
          phone: "01012345678",
          role: role || "user",
          created_at: "2026-10-22T10:00:00Z",
        };
      } else if (path === "/auth/login") {
        authenticated = true;
        data = {
          token: "test-token",
          user: { id: 9, name: "Maya Hassan", role: "user" },
        };
      } else if (path === "/admin/couriers")
        data = [
          {
            id: 3,
            name: "Ali Omar",
            email: "ali@example.test",
            phone: "01022223333",
          },
        ];
      else if (path.endsWith("/history") || path.endsWith("/assignments"))
        data = [];
      else if (method === "GET")
        data =
          role === "courier"
            ? current.map((o) => ({
                ...o,
                order_id: o.id,
                order_status: o.status,
                assigned_at: o.created_at,
                assignment_status: o.assignment_status || "pending",
              }))
            : current;
      else if (path.endsWith("/courier")) {
        current[0].courier_id = Number(body.courier_id);
        current[0].courier_name = "Ali Omar";
        data = body;
      } else if (path.endsWith("/accept")) {
        current[0].assignment_status = "accepted";
        data = {};
      } else if (path.endsWith("/status")) {
        current[0].status = body.status;
        data = body;
      } else if (path.endsWith("/cancel")) {
        current[0].status = "cancelled";
        data = {};
      } else if (path === "/orders" && method === "POST") {
        current = [{ ...shipment, ...body, id: 15 }, ...current];
        data = { id: 15 };
      } else data = {};
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
  return calls;
}
beforeEach(() => vi.restoreAllMocks());
describe("Tools Project workflows", () => {
  it("shows a clean sign in screen and loads the full account profile after login", async () => {
    const calls = mockServer(null, []);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back." });
    expect(screen.queryByText(/session has ended/)).toBeNull();
    await user.type(
      screen.getByLabelText("Email address"),
      "maya@example.test",
    );
    await user.type(screen.getByLabelText("Password"), "Assignment123!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("heading", { name: "Welcome back, Maya." });
    await user.click(screen.getByRole("button", { name: "My account" }));
    expect(screen.getByText("maya@example.test")).toBeTruthy();
    expect(calls.find((c) => c.path === "/auth/login")?.body.email).toBe(
      "maya@example.test",
    );
  });
  it("lets a customer create a shipment and confirms before cancelling it", async () => {
    const calls = mockServer("user", []);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back, Maya." });
    await user.click(screen.getByRole("button", { name: "New shipment" }));
    const form = screen.getByRole("dialog");
    await user.type(
      within(form).getByLabelText("Pickup address"),
      shipment.pickup_location,
    );
    await user.type(
      within(form).getByLabelText("Delivery address"),
      shipment.dropoff_location,
    );
    await user.type(
      within(form).getByLabelText("Package details"),
      shipment.package_details,
    );
    await user.type(
      within(form).getByLabelText(/Requested delivery time/),
      "2027-11-12T14:00",
    );
    await user.click(
      within(form).getByRole("button", { name: "Create shipment" }),
    );
    await screen.findByText("PCL-00015");
    expect(
      calls.find((c) => c.path === "/orders" && c.method === "POST")?.body
        .delivery_time,
    ).toMatch(/Z$/);
    await user.click(screen.getByRole("button", { name: "View PCL-00015" }));
    await user.click(screen.getByRole("button", { name: "Cancel shipment" }));
    expect(calls.some((c) => c.path.endsWith("/cancel"))).toBe(false);
    await user.click(
      screen.getByRole("button", { name: "Yes, cancel shipment" }),
    );
    await screen.findByText("Shipment cancelled.");
    expect(
      calls.some((c) => c.path === "/orders/15/cancel" && c.method === "PATCH"),
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "Couriers" })).toBeNull();
  });
  it("lets an admin assign a courier and advance a delivery one step", async () => {
    const calls = mockServer("admin");
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "View PCL-00014" });
    expect(screen.queryByRole("button", { name: "New shipment" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "View PCL-00014" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Choose a courier" }),
      "3",
    );
    await user.click(screen.getByRole("button", { name: "Assign courier" }));
    await screen.findByText("Courier assigned.");
    expect(calls.find((c) => c.path.endsWith("/courier"))?.body).toEqual({
      courier_id: 3,
    });
    await user.click(screen.getByRole("button", { name: "Mark as picked up" }));
    await screen.findByRole("button", { name: "Mark as in transit" });
    expect(
      screen.queryByRole("button", { name: "Mark as delivered" }),
    ).toBeNull();
    expect(calls.find((c) => c.path.endsWith("/status"))?.body).toEqual({
      status: "picked_up",
    });
  });
  it("requires a courier to accept an assignment before updating its status", async () => {
    const calls = mockServer("courier", [
      { ...shipment, courier_id: 3, courier_name: "Ali Omar" },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "View PCL-00014" }),
    );
    expect(
      screen.queryByRole("button", { name: "Mark as picked up" }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Accept assignment" }));
    await user.click(
      await screen.findByRole("button", { name: "Mark as picked up" }),
    );
    await screen.findByRole("button", { name: "Mark as in transit" });
    expect(calls.some((c) => c.path === "/courier/orders/14/accept")).toBe(
      true,
    );
    expect(
      screen.queryByRole("button", { name: "Delete shipment" }),
    ).toBeNull();
  });
  it("filters the in-transit summary to include picked-up shipments", async () => {
    mockServer("user", [
      { ...shipment, status: "picked_up" },
      { ...shipment, id: 15, status: "in_transit" },
      { ...shipment, id: 16, status: "delivered" },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "View PCL-00014" });
    await user.click(screen.getByRole("button", { name: /In transit.*02/ }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "View PCL-00016" }),
      ).toBeNull(),
    );
    expect(screen.getByRole("button", { name: "View PCL-00014" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "View PCL-00015" })).toBeTruthy();
  });
});
