
import { useState } from "react";
import api from "./services/api";
import "./Auth.css";

function ResetPassword({ token, onLoginClick }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError("This password reset link is missing or invalid. Please request a new one.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your passwords do not match. Please check them and try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setMessage(
        response.data.message || "Your password has been reset successfully."
      );

      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to reset your password. Your reset link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container auth-reset-container">
      <div className="auth-card auth-reset-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">T</div>
          <span>TalentFlow</span>
        </div>

        <div className="reset-password-icon" aria-hidden="true">
          {message ? (
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="27" fill="#DCFCE7" />
              <path
                d="M19 32L28 41L46 23"
                stroke="#16A34A"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 64 64" fill="none">
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
          )}
        </div>

        {message ? (
          <div className="reset-success-view">
            <h2>Password reset successful!</h2>
            <p>{message}</p>
            <p className="reset-success-description">
              Your account is ready to use. Sign in with your new password to
              continue to TalentFlow.
            </p>

            <button
              type="button"
              className="auth-primary-button"
              onClick={onLoginClick}
            >
              Go to Login <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <>
            <div className="reset-password-heading">
              <h2>Create a new password</h2>
              <p>
                Choose a strong password to keep your TalentFlow account
                secure.
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

            <form
              className="reset-password-form"
              onSubmit={handleResetPassword}
            >
              <label htmlFor="reset-new-password">New password</label>

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
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <input
                  id="reset-new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  disabled={loading}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="reset-password-hint">
                Use at least 8 characters.
              </p>

              <label htmlFor="reset-confirm-password">
                Confirm new password
              </label>

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
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                  disabled={loading}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {confirmPassword && (
                <p
                  className={
                    newPassword === confirmPassword
                      ? "reset-password-match match"
                      : "reset-password-match mismatch"
                  }
                  aria-live="polite"
                >
                  {newPassword === confirmPassword
                    ? "✓ Passwords match"
                    : "Passwords do not match yet"}
                </p>
              )}

              <button
                type="submit"
                className="auth-primary-button reset-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    Resetting password...
                  </>
                ) : (
                  <>
                    Reset Password <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              className="reset-back-button"
              onClick={onLoginClick}
              disabled={loading}
            >
              <span aria-hidden="true">←</span> Back to Login
            </button>

            <p className="auth-security-note">
              <span aria-hidden="true">🔒</span>
              Your account security matters to us.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;