
import { useState } from "react";
import api from "./services/api";
import "./Auth.css";

function ForgotPassword({ onLoginClick }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setMessage(
        response.data.message || "If your account exists, password reset instructions will be sent to your email."
      );

      setEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container auth-forgot-container">
      <div className="auth-card auth-forgot-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">T</div>
          <span>TalentFlow</span>
        </div>

        <div className="forgot-password-icon" aria-hidden="true">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="12"
              y="27"
              width="40"
              height="28"
              rx="7"
              fill="#E8EEFF"
              stroke="#4F46E5"
              strokeWidth="2.5"
            />
            <path
              d="M21 27V19C21 12.925 25.925 8 32 8C38.075 8 43 12.925 43 19V27"
              stroke="#4F46E5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="32" cy="39" r="4" fill="#4F46E5" />
            <path
              d="M32 43V47"
              stroke="#4F46E5"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="forgot-password-heading">
          <h2>Forgot your password?</h2>
          <p>
            No worries! Enter the email address associated with your account,
            and we'll help you reset your password.
          </p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            <span className="auth-alert-icon" aria-hidden="true">
              !
            </span>
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="auth-alert auth-alert-success" role="status">
            <span className="auth-alert-icon" aria-hidden="true">
              ✓
            </span>
            <p>{message}</p>
          </div>
        )}

        <form
          className="forgot-password-form"
          onSubmit={handleForgotPassword}
        >
          <label htmlFor="forgot-email">Email address</label>

          <div className="auth-input-wrapper">
            <svg
              className="auth-input-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>

            <input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setMessage("");
              }}
              autoComplete="email"
              maxLength={254}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-primary-button forgot-submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Sending request...
              </>
            ) : (
              <>
                Send Reset Instructions
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        <div className="forgot-password-divider">
          <span>Remember your password?</span>
        </div>

        <button
          type="button"
          className="forgot-back-button"
          onClick={onLoginClick}
          disabled={loading}
        >
          <span aria-hidden="true">←</span>
          Back to Login
        </button>

        <p className="auth-security-note">
          Your account security matters to us.
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;