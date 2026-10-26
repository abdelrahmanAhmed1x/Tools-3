import { useState, type FormEvent } from "react";
import { ArrowRight, MapPin, Package, CalendarDays } from "lucide-react";
import { api } from "./api";
import { Modal, Spinner } from "./ui";

export default function CreateOrder({
  close,
  created,
}: {
  close: () => void;
  created: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const delivery = new Date(String(data.delivery_time));
    if (delivery.getTime() <= Date.now()) {
      setError("Choose a delivery time in the future.");
      return;
    }
    if (
      ["pickup_location", "dropoff_location", "package_details"].some(
        (key) => !String(data[key]).trim(),
      )
    ) {
      setError("Please fill in both addresses and the package details.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/orders", "POST", {
        ...data,
        pickup_location: String(data.pickup_location).trim(),
        dropoff_location: String(data.dropoff_location).trim(),
        package_details: String(data.package_details).trim(),
        delivery_time: delivery.toISOString(),
      });
      created();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Let’s send something."
      subtitle="Add the details. We’ll take it from there."
      close={close}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="form-section-label">
          <MapPin size={16} /> THE JOURNEY
        </div>
        <label>
          Pickup address
          <textarea
            name="pickup_location"
            placeholder="Street, building, apartment, and city"
            rows={2}
            required
            maxLength={2000}
          />
        </label>
        <label>
          Delivery address
          <textarea
            name="dropoff_location"
            placeholder="Where should we deliver your package?"
            rows={2}
            required
            maxLength={2000}
          />
        </label>
        <div className="form-section-label">
          <Package size={16} /> THE PACKAGE
        </div>
        <label>
          Package details
          <textarea
            name="package_details"
            placeholder="What are you sending? Include size or handling instructions."
            rows={3}
            required
            maxLength={4000}
          />
        </label>
        <label>
          <span className="flex items-center gap-2">
            <CalendarDays size={15} /> Requested delivery time
          </span>
          <input
            name="delivery_time"
            type="datetime-local"
            required
            min={new Date(Date.now() + 60000)
              .toLocaleString("sv-SE")
              .slice(0, 16)
              .replace(" ", "T")}
          />
          <span className="field-help">Times are in your local timezone.</span>
        </label>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        <div className="modal-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={close}
          >
            Go back
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? (
              <Spinner />
            ) : (
              <>
                Create shipment <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
