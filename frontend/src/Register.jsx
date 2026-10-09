import { useState } from "react";
import api from "./services/api";
import "./Auth.css";

function Register({
  onLoginClick,
  onRegisterSuccess
}) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleRegister = async (e) => {

    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {

      const response = await api.post(
        "/auth/register",
        {
          name: name,
          email: email,
          password: password,
          role: role,
        }
      );

      console.log(
        "Registration successful:",
        response.data
      );

      setMessage(
        "Registration successful! Please login."
      );

      setName("");
      setEmail("");
      setPassword("");
      setRole("candidate");

      setTimeout(() => {
        onRegisterSuccess();
      }, 1000);

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );

      if (error.response?.data?.detail) {

        setError(
          error.response.data.detail
        );

      } else {

        setError(
          "Registration failed. Please try again."
        );

      }

    } finally {

      setLoading(false);

    }
  };


  return (

    <div className="auth-page">
      <div className="auth-brand-panel">

        <div className="auth-brand">

          <div className="auth-brand-icon">
            T
          </div>

          <div className="auth-brand-name">
            TalentFlow
          </div>

        </div>


        <div className="auth-brand-content">

          <div className="eyebrow">
            START YOUR CAREER JOURNEY
          </div>

          <h1>
            Your next
            <br />
            <span>opportunity starts here.</span>
          </h1>

          <div className="auth-features">

            <div className="auth-feature">

              <div className="auth-feature-icon">
                ✓
              </div>

              <span>
                Build your professional profile
              </span>

            </div>

            <div className="auth-feature">

              <div className="auth-feature-icon">
                ✓
              </div>

              <span>
                Explore relevant job opportunities
              </span>

            </div>


            <div className="auth-feature">

              <div className="auth-feature-icon">
                ✓
              </div>

              <span>
                Manage your complete job search journey
              </span>

            </div>

          </div>

        </div>

      </div>

      <div className="auth-form-area">
        <div className="auth-card-modern">

          <div className="auth-mobile-brand">

            <div className="auth-mobile-brand-icon">
              T
            </div>

            <div className="auth-mobile-brand-name">
              TalentFlow
            </div>
          </div>

          <div className="auth-header">

            <h2>
              Create your account
            </h2>

            <p>
              Join TalentFlow and take the next step in your career.
            </p>

          </div>

          <form
            className="auth-form"
            onSubmit={handleRegister}
          >

            <div className="auth-field">

              <label htmlFor="register-name">
                Full name
              </label>

              <input
                id="register-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">
                Email address
              </label>

              <input
                id="register-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="auth-password-wrapper">

                <input
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />
              </div>
            </div>
            <div className="auth-field">

              <label htmlFor="register-role">
                I am joining as
              </label>

              <select
                id="register-role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
              >

                <option value="candidate">
                  Candidate — Looking for opportunities
                </option>

                <option value="recruiter">
                  Recruiter — Hiring talent
                </option>

              </select>

              <div className="auth-role-help">
                Choose the account type that best describes you.
              </div>

            </div>
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create account"}

            </button>

          </form>

          {message && (

            <div className="auth-message auth-success">
              {message}
            </div>

          )}

          {error && (

            <div className="auth-message auth-error">
              {error}
            </div>

          )}

          <p className="auth-switch">

            Already have an account?

            <button
              type="button"
              onClick={onLoginClick}
            >
              Sign in
            </button>

          </p>

          <div className="auth-security">
            Your information is securely protected
          </div>

        </div>

      </div>

    </div>

  );
}
export default Register;