import { useEffect, useState } from "react";

import api from "./services/api";

import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

import RecruiterDashboard from "./RecruiterDashboard";
import CandidateDashboard from "./CandidateDashboard";

function App() {

  const [page, setPage] = useState("login");
  const [resetToken, setResetToken] = useState(null);
  const [user, setUser] = useState(() => {

    const savedUser =
      localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;

  });


  // CHECK EXISTING LOGIN
  useEffect(() => {

    // CHECK PASSWORD RESET LINK
    const params =
      new URLSearchParams(
        window.location.search
      );

    const token =
      params.get("reset_token");


    if (token) {

      setResetToken(token);
      setPage("reset-password");

      return;

    }

    // CHECK CURRENT BROWSER SESSION
    const browserSession =
      sessionStorage.getItem(
        "talentflow_session"
      );


    // If the browser session does not exist, show Login instead of restoring the previous login from localStorage.

    if (!browserSession) {

      setUser(null);
      setPage("login");

      return;

    }

    // CHECK EXISTING LOGIN TOKEN
    const accessToken =
      localStorage.getItem("token");


    if (!accessToken) {

      sessionStorage.removeItem(
        "talentflow_session"
      );

      localStorage.removeItem("user");

      setUser(null);
      setPage("login");

      return;

    }

    // VERIFY TOKEN WITH BACKEND
    api.get(
      "/auth/me",
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    )

      .then((response) => {

        const loggedInUser =
          response.data;


        console.log(
          "Current user:",
          loggedInUser
        );


        setUser(
          loggedInUser
        );


        localStorage.setItem(
          "user",
          JSON.stringify(loggedInUser)
        );


        // ROLE BASED REDIRECTION
        if (
          loggedInUser.role ===
          "recruiter"
        ) {

          setPage("recruiter");

        } else if (
          loggedInUser.role ===
          "candidate"
        ) {

          setPage("candidate");

        } else {

          localStorage.removeItem("token");
          localStorage.removeItem("user");

          sessionStorage.removeItem(
            "talentflow_session"
          );

          setUser(null);
          setPage("login");

        }

      })

      .catch((error) => {

        console.error(
          "Session expired:",
          error
        );


        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        sessionStorage.removeItem(
          "talentflow_session"
        );


        setUser(null);

        setPage("login");

      });

  }, []);


  // LOGIN SUCCESS
  const handleLoginSuccess =
    async () => {

      const token =
        localStorage.getItem(
          "token"
        );


      if (!token) {

        console.error(
          "Token not found"
        );

        return;

      }


      try {

        const response =
          await api.get(
            "/auth/me",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        const loggedInUser =
          response.data;


        console.log(
          "Logged-in user:",
          loggedInUser
        );


        // CREATE CURRENT BROWSER SESSION
        sessionStorage.setItem(
          "talentflow_session",
          "active"
        );


        setUser(
          loggedInUser
        );


        localStorage.setItem(
          "user",
          JSON.stringify(
            loggedInUser
          )
        );


        // ROLE BASED DASHBOARD
        if (
          loggedInUser.role ===
          "recruiter"
        ) {

          setPage("recruiter");

        } else if (
          loggedInUser.role ===
          "candidate"
        ) {

          setPage("candidate");

        } else {

          console.error(
            "Unknown user role:",
            loggedInUser.role
          );


          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          sessionStorage.removeItem(
            "talentflow_session"
          );

          setUser(null);

          setPage("login");

        }

      } catch (error) {

        console.error(
          "Error getting user:",
          error
        );


        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        sessionStorage.removeItem(
          "talentflow_session"
        );


        setUser(null);

        setPage("login");

      }

    };


  // LOGOUT
  const handleLogout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );


    sessionStorage.removeItem(
      "talentflow_session"
    );


    setUser(null);

    setPage("login");

  };


  // UI
  return (

    <div>

      {page === "login" && (

        <Login

          onRegisterClick={() =>
            setPage("register")
          }

          onForgotPasswordClick={() =>
            setPage("forgot-password")
          }

          onLoginSuccess={
            handleLoginSuccess
          }

        />

      )}

      {page === "register" && (

        <Register

          onLoginClick={() =>
            setPage("login")
          }

          onRegisterSuccess={() =>
            setPage("login")
          }

        />

      )}

      {page === "forgot-password" && (

        <ForgotPassword

          onLoginClick={() =>
            setPage("login")
          }

        />

      )}

      {page === "reset-password" && (

        <ResetPassword

          token={resetToken}

          onLoginClick={() => {

            // Remove reset token from URL
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );


            setResetToken(null);

            setPage("login");

          }}

        />

      )}


      {page === "recruiter" && (

        <RecruiterDashboard

          user={user}

          onLogout={handleLogout}

        />

      )}

      {page === "candidate" && (

        <CandidateDashboard

          user={user}

          onLogout={handleLogout}

        />

      )}

    </div>
  );
}

export default App;