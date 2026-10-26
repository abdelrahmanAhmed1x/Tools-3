import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  PackageCheck,
  Route,
  ShieldCheck,
} from "lucide-react";
import { api } from "./api";
import { Brand, Spinner } from "./ui";
import type { User } from "./types";

export default function Auth({
  onLogin,
  expired,
}: {
  onLogin: (user: User) => void;
  expired: boolean;
}) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (register) await api("/auth/register", "POST", data);
      await api("/auth/login", "POST", {
        email: data.email,
        password: data.password,
      });
      onLogin(await api<User>("/auth/me"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Brand light />
        <div className="auth-story-content">
          <span className="eyebrow">EVERY DELIVERY, CONNECTED</span>
          <h1>
            Good things.
            <br />
            On their way.
          </h1>
          <p>
            From the first pickup to the final doorstep.
            <br />A little more clarity at every step.
          </p>
          <div className="parcel-illustration" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="illustration-line" />
            <div className="illustration-pin pin-start">
              <Route size={23} />
            </div>
            <div className="illustration-box">
              <div className="box-tape" />
              <div className="box-label">
                <span />
                <span />
                <span />
              </div>
              <PackageCheck size={35} />
            </div>
            <div className="illustration-pin pin-end">
              <Check size={24} />
            </div>
            <span className="illustration-caption">
              A smoother journey, from A to B.
            </span>
          </div>
        </div>
        <div className="auth-story-footer">
          <ShieldCheck size={17} /> Your deliveries. All in one place.
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow text-teal-300">YOUR DELIVERY WORKSPACE</span>
          <h2>{register ? "Let’s get you moving." : "Welcome back."}</h2>
          <p className="auth-description">
            {register
              ? "Create an account and send your first shipment."
              : "Sign in to keep your deliveries on track."}
          </p>
          {expired && (
            <div className="notice">
              Your session has ended. Please sign in again.
            </div>
          )}
          <form onSubmit={submit} className="auth-form">
            {register && (
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Your full name"
                  required
                  minLength={2}
                  maxLength={150}
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={255}
              />
            </label>
            {register && (
              <label>
                Phone number
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Your contact number"
                  required
                  minLength={7}
                  maxLength={20}
                />
              </label>
            )}
            <label>
              Password
              <div className="password-input">
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={
                    register ? "At least 8 characters" : "Enter your password"
                  }
                  required
                  minLength={8}
                  maxLength={72}
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <div role="alert" className="error-message">
                {error}
              </div>
            )}
            <button
              className="button button-primary w-full justify-between mt-2"
              disabled={busy}
            >
              {busy ? <Spinner /> : register ? "Create account" : "Sign in"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to Tools Project?"}{" "}
            <button
              disabled={busy}
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}{" "}
              <ArrowRight size={13} />
            </button>
          </p>
          <div className="auth-note">
            <span /> Built for customers, couriers, and the people connecting
            them.
          </div>
        </div>
        <p className="auth-copyright">
          TOOLS PROJECT © {new Date().getFullYear()}{" "}
          <span>Made for the journey.</span>
        </p>
      </section>
    </div>
  );
}
