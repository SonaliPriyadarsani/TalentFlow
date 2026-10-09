import { useState } from "react";
import api from "./services/api";
import "./Auth.css";

function Login({
  onRegisterClick,
  onLoginSuccess,
  onForgotPasswordClick
}) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      const response = await api.post(
        "/auth/login",
        {
          email: email,
          password: password,
        }
      );

      console.log(
        "Login response:",
        response.data
      );

      const token =
        response.data.access_token;

      localStorage.setItem(
        "token",
        token
      );

      console.log(
        "Login successful"
      );

      onLoginSuccess();

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      if (error.response) {

        setError(
          error.response.data?.detail ||
          "Invalid email or password"
        );

      } else {

        setError(
          "Unable to connect to server"
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
            YOUR CAREER. YOUR NEXT MOVE.
          </div>

          <h1>
            Find the right
            <br />
            <span>opportunity.</span>
          </h1>

          <div className="auth-features">

            <div className="auth-feature">

              <div className="auth-feature-icon">
                ✓
              </div>

              <span>
                Discover opportunities that match your skills
              </span>

            </div>


            <div className="auth-feature">

              <div className="auth-feature-icon">
                ✓
              </div>

              <span>
                Apply to jobs and track your applications
              </span>

            </div>


            <div className="auth-feature">

              <div className="auth-feature-icon">
                ✓
              </div>

              <span>
                Connect with recruiters and growing companies
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
              Welcome back
            </h2>

            <p>
              Sign in to continue to your TalentFlow account.
            </p>

          </div>


          <form
            className="auth-form"
            onSubmit={handleLogin}
          >

            <div className="auth-field">

              <label htmlFor="login-email">
                Email address
              </label>

              <input
                id="login-email"
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

              <label htmlFor="login-password">
                Password
              </label>

              <div className="auth-password-wrapper">

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

              </div>

            </div>


            <div className="auth-forgot-row">

              <button
                type="button"
                className="auth-link"
                onClick={onForgotPasswordClick}
              >
                Forgot password?
              </button>

            </div>


            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading
                ? "Signing in..."
                : "Sign in"}

            </button>

          </form>


          {error && (

            <div className="auth-message auth-error">
              {error}
            </div>

          )}


          <p className="auth-switch">

            Don't have an account?

            <button
              type="button"
              onClick={onRegisterClick}
            >
              Create account
            </button>

          </p>


         

        </div>

      </div>

    </div>

  );
}

export default Login;