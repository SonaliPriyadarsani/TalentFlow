import { useEffect, useState } from "react";
import api from "./services/api";
import CreateJob from "./CreateJob";
import EditJob from "./EditJob";
import ApplicationsPage from "./ApplicationsPage";
import CompanyProfile from "./CompanyProfile";
import "./RecruiterDashboard.css";
import "./RecruiterDashboardLayout.css";

function RecruiterDashboard({ user, onLogout }) {

  const [jobs, setJobs] = useState([]);
  const [applicationCounts, setApplicationCounts] = useState({});
  const [activeSection, setActiveSection] = useState("overview");
  const [appliedCount, setAppliedCount] = useState(0);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showEditJob, setShowEditJob] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Get recruiter's own jobs
      const response = await api.get(
        "/jobs/recruiter/my"
      );

      setJobs(response.data);
      const counts = {};

      let appliedApplicants = 0;
      let shortlistedApplicants = 0;
      let interviewApplicants = 0;
      let selectedApplicants = 0;
      let rejectedApplicants = 0;

      for (const job of response.data) {

        try {

          const applicationsResponse =
            await api.get(
              `/applications/job/${job.id}`
            );

          const jobApplications =
            applicationsResponse.data;

          counts[job.id] = jobApplications.length;

          appliedApplicants +=
            jobApplications.filter(
              (application) =>
                application.status === "Applied"
            ).length;

          shortlistedApplicants +=
            jobApplications.filter(
              (application) =>
                application.status === "Shortlisted"
            ).length;

          interviewApplicants +=
            jobApplications.filter(
              (application) =>
                application.status === "Interview"
            ).length;

          selectedApplicants +=
            jobApplications.filter(
              (application) =>
                application.status === "Selected"
            ).length;

          rejectedApplicants +=
            jobApplications.filter(
              (application) =>
                application.status === "Rejected"
            ).length;

        } catch (error) {

          console.error(
            "Error fetching applications:",
            error
          );

          counts[job.id] = 0;
        }
      }

      setApplicationCounts(counts);

      setAppliedCount(
        appliedApplicants
      );

      setShortlistedCount(
        shortlistedApplicants
      );

      setInterviewCount(
        interviewApplicants
      );

      setSelectedCount(
        selectedApplicants
      );

      setRejectedCount(
        rejectedApplicants
      );

    } catch (error) {

      console.error(
        "Error fetching recruiter jobs:",
        error
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);
  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}, [activeSection]);

  const filteredJobs = jobs
    .filter((job) => {

      const search =
        searchTerm.toLowerCase();

      const title =
        String(job.title || "").toLowerCase();

      const company =
        String(job.company || "").toLowerCase();

      const skills =
        String(job.skills || "").toLowerCase();

      const matchesSearch =
        title.includes(search) ||
        company.includes(search) ||
        skills.includes(search);

      const matchesLocation =
        selectedLocation === "" ||
        job.location === selectedLocation;

      const matchesExperience =
        selectedExperience === "" ||
        job.experience === selectedExperience;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesExperience
      );
    })
    .sort((a, b) => {

      if (sortOption === "newest") {

        return (
          new Date(b.created_at) -
          new Date(a.created_at)
        );

      }

      if (sortOption === "oldest") {

        return (
          new Date(a.created_at) -
          new Date(b.created_at)
        );

      }

      if (sortOption === "mostApplicants") {

        return (
          (applicationCounts[b.id] || 0) -
          (applicationCounts[a.id] || 0)
        );

      }

      if (sortOption === "fewestApplicants") {

        return (
          (applicationCounts[a.id] || 0) -
          (applicationCounts[b.id] || 0)
        );

      }

      return 0;
    });

  const totalJobs = jobs.length;

  const totalApplicants =
    Object.values(applicationCounts)
      .reduce(
        (total, count) =>
          total + count,
        0
      );

  const handleJobCreated = () => {
    setShowCreateJob(false);
    setActiveSection("jobs");
    fetchJobs();
  };

  const handleJobUpdated = () => {
    setShowEditJob(false);
    setJobToEdit(null);
    setActiveSection("jobs");
    fetchJobs();
  };

  const deleteJob = async (jobId) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this job?"
      );

    if (!confirmDelete) {
      return;
    }

    try {

      await api.delete(
        `/jobs/${jobId}`
      );

      // Remove deleted job
      setJobs((previousJobs) =>
        previousJobs.filter(
          (job) =>
            job.id !== jobId
        )
      );

      // Remove application count
      setApplicationCounts(
        (previousCounts) => {

          const updatedCounts = {
            ...previousCounts
          };
          delete updatedCounts[jobId];
          return updatedCounts;
        }
      );

    } catch (error) {

      console.error(
        "Error deleting job:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Failed to delete job."
      );
    }
  };

  if (selectedJob) {

    return (
      <div className="recruiter-dashboard recruiter-subpage">

        <ApplicationsPage
          job={selectedJob}

          onBack={() => {

            setSelectedJob(null);

            fetchJobs();

          }}
        />

      </div>
    );
  }

  if (
    showEditJob &&
    jobToEdit
  ) {

    return (
      <div className="recruiter-dashboard recruiter-subpage">

        <EditJob
          job={jobToEdit}
          onJobUpdated={
            handleJobUpdated
          }

          onCancel={() => {
            setShowEditJob(false);
            setJobToEdit(null);

          }}
        />

      </div>
    );
  }

  if (showCreateJob) {

    return (
      <div className="recruiter-dashboard recruiter-subpage">

        <CreateJob
          onJobCreated={
            handleJobCreated
          }

          onCancel={() => {

            setShowCreateJob(false);

          }}
        />

      </div>
    );
  }

  const handleChangePassword = async (event) => {

    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    // Validate empty fields
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {

      setPasswordError(
        "Please fill in all password fields."
      );

      return;
    }

    // Minimum password length
    if (newPassword.length < 8) {

      setPasswordError(
        "New password must be at least 8 characters long."
      );

      return;
    }

    // Confirm password
    if (
      newPassword !== confirmPassword
    ) {

      setPasswordError(
        "New password and confirm password do not match."
      );

      return;
    }

    // New password must be different
    if (
      currentPassword === newPassword
    ) {

      setPasswordError(
        "New password must be different from your current password."
      );

      return;
    }

    try {

      setPasswordLoading(true);

      const response =
        await api.post(
          "/auth/change-password",
          {
            current_password:
              currentPassword,

            new_password:
              newPassword,

            confirm_password:
              confirmPassword
          }
        );

      setPasswordMessage(
        response.data.message ||
        "Password changed successfully!"
      );

      // Clear fields after successful update
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {

      console.error(
        "Error changing password:",
        error
      );

      setPasswordError(
        error.response?.data?.detail ||
        "Failed to change password."
      );

    } finally {

      setPasswordLoading(false);

    }
  };

  if (showCompanyProfile) {

    return (
      <div className="recruiter-dashboard recruiter-subpage">

        <CompanyProfile
          onBack={() => {

            setShowCompanyProfile(false);

            fetchJobs();

          }}
        />

      </div>
    );
  }

  return (

    <div className="recruiter-dashboard">
      
<aside className="recruiter-sidebar">
  <button
    type="button"
    className="recruiter-brand"
    onClick={() => setActiveSection("overview")}
    aria-label="Go to TalentFlow dashboard"
  >
    <span className="recruiter-brand-icon">T</span>
    <span className="recruiter-brand-text">
      <strong>TalentFlow</strong>
      <small>HIRING MANAGEMENT</small>
    </span>
  </button>

  <div className="sidebar-workspace">
    <span className="sidebar-section-label">WORKSPACE</span>

    <button
      type="button"
      className={`sidebar-nav-item ${
        activeSection === "overview" ? "active" : ""
      }`}
      onClick={() => setActiveSection("overview")}
    >
      <span className="sidebar-nav-icon">⌂</span>
      <span>Overview</span>
    </button>

    <button
      type="button"
      className={`sidebar-nav-item ${
        activeSection === "jobs" ? "active" : ""
      }`}
      onClick={() => setActiveSection("jobs")}
    >
      <span className="sidebar-nav-icon">▤</span>
      <span>My Job Postings</span>
      <span className="sidebar-nav-count">{totalJobs}</span>
    </button>

    <span className="sidebar-section-label sidebar-account-label">
      ACCOUNT
    </span>

    <button
      type="button"
      className="sidebar-nav-item"
      onClick={() => setShowCompanyProfile(true)}
    >
      <span className="sidebar-nav-icon">▦</span>
      <span>Company Profile</span>
    </button>

    <button
      type="button"
      className={`sidebar-nav-item ${
        activeSection === "password" ? "active" : ""
      }`}
      onClick={() => {
        setActiveSection("password");
        setPasswordMessage("");
        setPasswordError("");
      }}
    >
      <span className="sidebar-nav-icon">♙</span>
      <span>Account Security</span>
    </button>
  </div>

  <div className="sidebar-bottom">
    <div className="sidebar-help-card">
      <span className="sidebar-help-icon">✦</span>
      <strong>TalentFlow Workspace</strong>
      <p>Manage your hiring journey in one place.</p>
    </div>

    <button
      type="button"
      className="sidebar-logout-button"
      onClick={onLogout}
    >
      <span className="sidebar-nav-icon">↪</span>
      <span>Sign out</span>
    </button>

    <div className="sidebar-version">TALENTFLOW · RECRUITER PORTAL</div>
  </div>
</aside>

<div className="recruiter-main">
  <header className="recruiter-topbar">
    <div className="topbar-context">
      <span className="topbar-status-dot" />
      <span>Recruiter workspace</span>
    </div>

    <div className="topbar-user">
      <div className="topbar-avatar">
        {String(user?.name || "R").trim().charAt(0).toUpperCase()}
      </div>
      <div className="topbar-user-details">
        <strong>{user?.name || "Recruiter"}</strong>
        <span>Recruiter account</span>
      </div>
    </div>
  </header>

      <main className="jobs-container">
        {activeSection === "overview" && (
          <>
            <div className="recruiter-page-heading">

              <div>

                <span className="dashboard-eyebrow">
                  RECRUITER PORTAL
                </span>

                <h2>
                  Recruiter Dashboard
                </h2>

                <p>
                  Manage your job postings, applications,
                  and hiring activities from one place.
                </p>

              </div>

            </div>

            <div className="dashboard-stats">

              <div className="stat-card">

                <h3>
                  {totalJobs}
                </h3>

                <p>
                  My Jobs
                </p>

              </div>

              <div className="stat-card">

                <h3>
                  {interviewCount}
                </h3>

                <p>
                  Interview
                </p>

              </div>


              <div className="stat-card">

                <h3>
                  {selectedCount}
                </h3>

                <p>
                  Selected
                </p>

              </div>


              <div className="stat-card">

                <h3>
                  {rejectedCount}
                </h3>

                <p>
                  Rejected
                </p>

              </div>

            </div>

            <div className="recruiter-quick-actions">

              <button
                type="button"
                className="quick-action-card"
                onClick={() =>
                  setShowCompanyProfile(true)
                }
              >
                <span className="quick-action-content">

                  <strong>
                    Company Profile<br></br>
                  </strong>

                  <small>
                    Manage your company information
                  </small>

                </span>

                <span className="quick-action-arrow">
                  →
                </span>

              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => {
                  setActiveSection("password");
                  setPasswordMessage("");
                  setPasswordError("");

                }}
              >
                <span className="quick-action-content">

                  <strong>
                    Change Password<br></br>
                  </strong>

                  <small>
                    Secure your recruiter account
                  </small>

                </span>

                <span className="quick-action-arrow">
                  →
                </span>

              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => {

                  setActiveSection("jobs");

                }}
              >
                <span className="quick-action-content">

                  <strong>
                    My Job Postings<br></br>
                  </strong>
                  <small>
                    View and manage {totalJobs} job
                    {totalJobs !== 1
                      ? "s"
                      : ""}
                  </small>

                </span>

                <span className="quick-action-arrow">
                  →
                </span>

              </button>

            </div>

            <div className="create-job-section">

              <button
                type="button"
                className="create-job-button"
                onClick={() =>
                  setShowCreateJob(true)
                }
              >
                + Create New Job
              </button>

            </div>

          </>

        )}

        {activeSection === "password" && (

          <section className="dashboard-section">

            <div className="section-heading">

              <div>

                <span className="dashboard-eyebrow">
                  ACCOUNT SECURITY
                </span>

                <h2>
                  Change Password
                </h2>

                <p>
                  Update your account password securely.
                </p>

              </div>

              <button
                type="button"
                className="back-section-button"
                onClick={() => {
                  setActiveSection("overview");
                  setPasswordMessage("");
                  setPasswordError("");
                }}
              >
                ← Back to Dashboard
              </button>

            </div>

            <div className="recruiter-password-card">

              {passwordMessage && (
                <p className="success-message">
                  {passwordMessage}
                </p>

              )}

              {passwordError && (
                <p className="error-message">
                  {passwordError}
                </p>
              )}

              <form
                onSubmit={handleChangePassword}
                className="profile-form"
              >
                <label>
                  Current Password
                </label>

                <div className="password-input-row">

                  <input
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter current password"
                    required
                  />

                  <button
                    type="button"
                    className="link-button password-toggle"
                    onClick={() =>
                      setShowCurrentPassword(
                        !showCurrentPassword
                      )
                    }
                  >
                    {showCurrentPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

                <label>
                  New Password
                </label>

                <div className="password-input-row">

                  <input
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter new password"
                    required
                  />

                  <button
                    type="button"
                    className="link-button password-toggle"
                    onClick={() =>
                      setShowNewPassword(
                        !showNewPassword
                      )
                    }
                  >
                    {showNewPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

                <small className="password-help-text">
                  Password must be at least 8 characters.
                </small>

                <label>
                  Confirm New Password
                </label>

                <div className="password-input-row">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    required
                  />

                  <button
                    type="button"
                    className="link-button password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

                <button
                  type="submit"
                  className="update-profile-button"
                  disabled={passwordLoading}
                >
                  {passwordLoading
                    ? "Changing Password..."
                    : "Change Password"}
                </button>

              </form>

            </div>

          </section>

        )}

        {activeSection === "jobs" && (

          <section
            className="dashboard-section"
            id="my-job-postings"
          >

            <div className="section-heading">

              <div>

                <span className="dashboard-eyebrow">
                  JOB MANAGEMENT
                </span>

                <h2>
                  My Job Postings
                </h2>

                <p>
                  View, manage, edit, and track all jobs
                  created by you.
                </p>

              </div>

              <div className="section-heading-actions">

                <button
                  type="button"
                  className="create-job-button"
                  onClick={() =>
                    setShowCreateJob(true)
                  }
                >
                  + Create New Job
                </button>

                <button
                  type="button"
                  className="back-section-button"
                  onClick={() =>
                    setActiveSection("overview")
                  }
                >
                  ← Back
                </button>

              </div>

            </div>

            <div className="recruiter-job-filters">
              <input
                type="text"
                placeholder="Search by job title, company, or skills"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
              />
              <select
                value={selectedLocation}
                onChange={(e) =>
                  setSelectedLocation(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Locations
                </option>

                {[
                  ...new Set(
                    jobs
                      .map(
                        (job) =>
                          job.location
                      )
                      .filter(Boolean)
                  )
                ].map(
                  (location) => (

                    <option
                      key={location}
                      value={location}
                    >
                      {location}
                    </option>

                  )
                )}

              </select>

              <select
                value={
                  selectedExperience
                }
                onChange={(e) =>
                  setSelectedExperience(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Experience
                </option>

                {[
                  ...new Set(
                    jobs
                      .map(
                        (job) =>
                          job.experience
                      )
                      .filter(Boolean)
                  )
                ].map(
                  (experience) => (

                    <option
                      key={experience}
                      value={experience}
                    >
                      {experience}
                    </option>

                  )
                )}

              </select>

              <select
                value={sortOption}
                onChange={(e) =>
                  setSortOption(
                    e.target.value
                  )
                }
              >

                <option value="newest">
                  Newest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>

                <option value="mostApplicants">
                  Most Applicants
                </option>

                <option value="fewestApplicants">
                  Fewest Applicants
                </option>

              </select>

              <button
                type="button"
                className="link-button clear-filter-button"
                onClick={() => {

                  setSearchTerm("");

                  setSelectedLocation("");

                  setSelectedExperience("");

                  setSortOption(
                    "newest"
                  );

                }}
              >
                Clear Filters
              </button>

            </div>

            {loading && (

              <div className="loading-message">
                Loading your jobs...
              </div>

            )}

            {!loading &&
              jobs.length === 0 && (

                <div className="job-card empty-job-card">

                  <div className="empty-job-icon">
                    💼
                  </div>

                  <h3>
                    You haven't created any jobs yet.
                  </h3>

                  <p>
                    Click "Create New Job" to post
                    your first job opportunity.
                  </p>

                  <button
                    type="button"
                    className="create-job-button"
                    onClick={() =>
                      setShowCreateJob(true)
                    }
                  >
                    + Create Your First Job
                  </button>

                </div>

              )}

            {!loading &&
              jobs.length > 0 &&
              filteredJobs.length === 0 && (

                <div className="job-card empty-job-card">

                  <div className="empty-job-icon">
                    🔎
                  </div>

                  <h3>
                    No jobs found
                  </h3>

                  <p>
                    No jobs match your search
                    or selected filters.
                  </p>

                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {

                      setSearchTerm("");

                      setSelectedLocation("");

                      setSelectedExperience("");

                      setSortOption(
                        "newest"
                      );

                    }}
                  >
                    Clear Filters
                  </button>

                </div>

              )}

            {!loading &&
              jobs.length > 0 &&
              filteredJobs.map(
                (job) => (

                  <div
                    className="job-card"
                    key={job.id}
                  >
                    <div className="job-card-header">

                      <div>

                        <h3>
                          {job.title}
                        </h3>

                        <p className="job-company">
                          {job.company}
                        </p>

                      </div>

                      <span
                        className={
                          job.closing_date &&
                          new Date(
                            job.closing_date
                          ) < new Date()
                            ? "job-status expired"
                            : "job-status open"
                        }
                      >
                        {job.closing_date &&
                        new Date(
                          job.closing_date
                        ) < new Date()
                          ? "Expired"
                          : "Open"}
                      </span>

                    </div>

                    <div className="job-details-grid">

                      <p>
                        <strong>
                          Location
                        </strong>
                        <span>
                          {job.location}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Experience
                        </strong>
                        <span>
                          {job.experience}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Job Type
                        </strong>
                        <span>
                          {job.job_type ||
                            "Full-time"}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Posted On
                        </strong>
                        <span>
                          {job.created_at
                            ? new Date(
                                job.created_at
                              ).toLocaleDateString()
                            : "Not specified"}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Application Deadline
                        </strong>
                        <span>
                          {job.closing_date
                            ? new Date(
                                job.closing_date
                              ).toLocaleDateString()
                            : "Not specified"}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Candidates Applied
                        </strong>
                        <span>
                          {applicationCounts[
                            job.id
                          ] ?? 0}
                        </span>
                      </p>

                    </div>

                    
<div className="job-skills-section">
  <strong className="job-section-label">Required Skills</strong>

  <div className="job-skill-tags">
    {String(job.skills || "")
      .split(/[,|]/)
      .map((skill) => skill.trim())
      .filter(Boolean)
      .map((skill, index) => (
        <span className="job-skill-tag" key={`${skill}-${index}`}>
          {skill}
        </span>
      ))}

    {!String(job.skills || "").trim() && (
      <span className="job-skills-empty">No skills specified</span>
    )}
  </div>
</div>


                    <div className="job-description">

                      <strong>
                        Description
                      </strong>

                      <p>
                        {job.description}
                      </p>

                    </div>

                    <div className="job-action-buttons">
                      <button
                        type="button"
                        className="apply-button"
                        onClick={() => {

                          setJobToEdit(
                            job
                          );

                          setShowEditJob(
                            true
                          );

                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="apply-button"
                        onClick={() =>
                          setSelectedJob(
                            job
                          )
                        }
                      >
                        Applications
                      </button>
                      <button
                        type="button"
                        className="apply-button delete-job-button"
                        onClick={() =>
                          deleteJob(
                            job.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>
                  </div>
                )
              )}
          </section>
        )}
      </main>
    </div>
    </div>
  );
}
export default RecruiterDashboard;