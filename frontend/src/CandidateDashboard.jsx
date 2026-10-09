import { useEffect, useState } from "react";
import api from "./services/api";
import "./CandidateDashboard.css";

function CandidateDashboard({ user, onLogout }) {

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedApplicationStatus, setSelectedApplicationStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [applicationTimelines, setApplicationTimelines] = useState({});
  const [applicationLoading, setApplicationLoading] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);
  const [savingJobId, setSavingJobId] = useState(null);
  const [showSavedJobs, setShowSavedJobs] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobSort, setJobSort] = useState("newest");
  const [showProfile, setShowProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    education: "",
    skills: "",
    experience: "",
    bio: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  // FETCH APPLICATION TIMELINES

  const fetchApplicationTimelines = async (applicationList) => {

    try {

      const timelineMap = {};

      await Promise.all(
        applicationList.map(async (application) => {

          try {

            const response = await api.get(
              `/applications/timeline/${application.id}`
            );

            timelineMap[application.id] =
              response.data;

          } catch (error) {

            console.error(
              `Failed to fetch timeline for application ${application.id}`,
              error
            );

            timelineMap[application.id] = [];

          }

        })
      );

      setApplicationTimelines(timelineMap);

    } catch (error) {

      console.error(
        "Failed to fetch application timelines",
        error
      );

    }

  };

  // FETCH JOBS

  const fetchJobs = async () => {

    try {

      const response = await api.get("/jobs/");

      setJobs(response.data);

    } catch (error) {

      console.error(
        "Error fetching jobs:",
        error
      );

      setError("Failed to load jobs.");

    }

  };

  // FETCH APPLICATIONS

  const fetchApplications = async () => {
    try {
      const response =
        await api.get(
          `/applications/candidate/${user.id}`
        );

      setApplications(response.data);
      await fetchApplicationTimelines(
        response.data
      );
    } catch (error) {

      console.error(
        "Error fetching applications:",
        error
      );

      setError(
        "Failed to load applications."
      );

    }

  };

  const getTimelineForApplication = (
    applicationId
  ) => {

    return (
      applicationTimelines[applicationId] ||
      []
    );

  };

  // FETCH INTERVIEWS

  const fetchInterviews = async () => {

    try {

      const response =
        await api.get(
          "/applications/interview/candidate"
        );

      setInterviews(
        response.data
      );

    } catch (error) {

      console.error(
        "Error fetching interviews:",
        error
      );

    }

  };

  // FETCH SAVED JOBS

  const fetchSavedJobs = async () => {

    try {

      setSavedJobsLoading(true);

      const response =
        await api.get(
          "/saved-jobs/"
        );

      setSavedJobs(
        response.data
      );

    } catch (error) {

      console.error(
        "Error fetching saved jobs:",
        error
      );

    } finally {

      setSavedJobsLoading(false);

    }

  };

  // SAVE / REMOVE JOB

  const handleSaveJob = async (jobId) => {

    try {

      setSavingJobId(jobId);

      const alreadySaved =
        savedJobs.some(
          (savedJob) =>
            savedJob.job_id === jobId
        );

      if (alreadySaved) {
        await api.delete(
          `/saved-jobs/${jobId}`
        );
      } else {

        await api.post(
          `/saved-jobs/${jobId}`
        );

      }

      await fetchSavedJobs();

    } catch (error) {

      console.error(
        "Error saving/removing job:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Failed to update saved job."
      );

    } finally {

      setSavingJobId(null);

    }

  };

  // CHECK IF JOB IS SAVED

  const isJobSaved = (jobId) => {

    return savedJobs.some(
      (savedJob) =>
        savedJob.job_id === jobId
    );

  };

  // FETCH NOTIFICATIONS

  const fetchNotifications = async () => {

    try {

      const response =
        await api.get(
          "/notifications/"
        );

      setNotifications(
        response.data
      );

      const hasUnreadNotification =
        response.data.some(
          (notification) =>
            notification.is_read === false
        );

      if (hasUnreadNotification) {

        setShowNotificationPopup(
          true
        );

      }

    } catch (error) {

      console.error(
        "Error fetching notifications:",
        error
      );
    }

  };

  // NOTIFICATION HELPERS

  const unreadNotificationCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  // OPEN NOTIFICATIONS

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setShowNotificationPopup(false);
    setShowProfile(false);
    setShowSavedJobs(false);
    setSelectedJob(null);
    setSelectedApplicationId(null);
    setActiveSection("dashboard");

  };

  // CLOSE NOTIFICATIONS

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  // NOTIFICATION CLICK

  const handleNotificationClick = async (
    notification
  ) => {

    try {

      await api.put(
        `/notifications/${notification.id}/read`
      );

      setNotifications(
        (previousNotifications) =>
          previousNotifications.map(
            (item) =>
              item.id === notification.id
                ? {
                    ...item,
                    is_read: true
                  }
                : item
          )
      );

      setSelectedApplicationId(
        notification.application_id
      );
      setSelectedApplicationStatus("");
      setSearchTerm("");
      setSelectedLocation("");
      setSelectedExperience("");
      setSelectedJob(null);
      setShowNotifications(false);
      setShowNotificationPopup(false);
      setShowSavedJobs(false);
      setShowProfile(false);
      // Open the My Applications section
      setActiveSection("applications");
    } catch (error) {

      console.error(
        "Error opening notification:",
        error
      );

    }

  };

  // OPEN JOB APPLICATIONS

  const handleOpenJobApplications = () => {
    setActiveSection("jobs");
    setShowSavedJobs(false);
    setShowProfile(false);
    setShowNotifications(false);
    setShowNotificationPopup(false);
    setSelectedJob(null);
    setSelectedApplicationId(null);
    setSelectedApplicationStatus("");
    setMessage("");
    setError("");

  };

  // OPEN MY APPLICATIONS
  const handleOpenMyApplications = () => {
    setActiveSection("applications");
    setShowSavedJobs(false);
    setShowProfile(false);
    setShowNotifications(false);
    setShowNotificationPopup(false);
    setSelectedJob(null);
    setSelectedApplicationId(null);
    setSelectedApplicationStatus("");
    setMessage("");
    setError("");

  };

  // BACK TO ALL APPLICATIONS

  const handleBackToAllApplications = () => {
    setSelectedApplicationId(null);
    setSelectedApplicationStatus("");
    setActiveSection("applications");

  };

  // OPEN SAVED JOBS

  const handleOpenSavedJobs = () => {
    setShowSavedJobs(true);
    setShowProfile(false);
    setShowNotifications(false);
    setShowNotificationPopup(false);
    setSelectedJob(null);
    setSelectedApplicationId(null);
    setSelectedApplicationStatus("");
    setSearchTerm("");
    setSelectedLocation("");
    setSelectedExperience("");
    setMessage("");
    setError("");

  };

  // BACK TO DASHBOARD

  const handleBackToDashboard = () => {
    setActiveSection("dashboard");
    setShowProfile(false);
    setShowSavedJobs(false);
    setShowNotifications(false);
    setShowNotificationPopup(false);
    setSelectedJob(null);
    setSelectedApplicationId(null);
    setSelectedApplicationStatus("");
    setEditingProfile(false);
    setShowChangePassword(false);
    setProfileMessage("");
    setProfileError("");
    setMessage("");
    setError("");
    setSearchTerm("");
    setSelectedLocation("");
    setSelectedExperience("");
  };

  // BACK TO JOBS

  const handleBackToJobs = () => {
    setActiveSection("jobs");
    setSelectedJob(null);
    setShowSavedJobs(false);
    setSelectedApplicationId(null);
    setSelectedApplicationStatus("");
  };

  // LOAD DATA

  useEffect(() => {

    const loadData = async () => {

      setLoading(true);

      await Promise.all([
        fetchJobs(),
        fetchApplications(),
        fetchInterviews(),
        fetchNotifications(),
        fetchSavedJobs()
      ]);

      setLoading(false);

    };

    if (user?.id) {

      loadData();

    }

  }, [user?.id]);

  // CHECK JOB EXPIRY

  const isJobExpired = (job) => {

    if (!job.closing_date) {
      return false;
    }

    const today = new Date();
    today.setHours(
      0,0,0, 0
    );

    const closingDate =
      new Date(
        job.closing_date
      );

    closingDate.setHours(
      0,0,0, 0
    );

    return today > closingDate;

  };

  // APPLY FOR JOB

  const handleApply = async (jobId) => {

    try {

      setApplicationLoading(
        jobId
      );

      setMessage("");

      setError("");

      await api.post(
        `/applications/${jobId}`,
        {}
      );

      setMessage(
        "Application submitted successfully!"
      );

      await fetchApplications();

    } catch (error) {

      console.error(
        "Error applying for job:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Failed to apply for this job."
      );

    } finally {

      setApplicationLoading(
        null
      );

    }

  };

  // CHECK IF ALREADY APPLIED

  const hasApplied = (jobId) => {

    return applications.some(
      (application) =>
        application.job_id === jobId
    );

  };

  // APPLICATION FILTER

  const filteredApplications =
    applications.filter(
      (application) => {

        const matchesStatus =
          selectedApplicationStatus === "" ||
          application.status ===
            selectedApplicationStatus;

        const matchesSelectedApplication =
          selectedApplicationId === null ||
          application.id ===
            selectedApplicationId;

        return (
          matchesStatus &&
          matchesSelectedApplication
        );

      }
    );

  // JOB FILTER

  const filteredJobs =
    jobs
      .filter((job) => {

        const search =
          searchTerm.toLowerCase();

        const matchesSearch =
          job.title
            .toLowerCase()
            .includes(search) ||
          job.company
            .toLowerCase()
            .includes(search) ||
          job.skills
            .toLowerCase()
            .includes(search);

        const matchesLocation =
          selectedLocation === "" ||
          job.location ===
            selectedLocation;

        const matchesExperience =
          selectedExperience === "" ||
          job.experience ===
            selectedExperience;

        return (
          matchesSearch &&
          matchesLocation &&
          matchesExperience
        );

      })
      .sort((a, b) => {

        if (jobSort === "newest") {

          return (
            new Date(b.created_at) -
            new Date(a.created_at)
          );

        }

        if (jobSort === "oldest") {

          return (
            new Date(a.created_at) -
            new Date(b.created_at)
          );

        }

        if (jobSort === "companyAZ") {

          return a.company.localeCompare(
            b.company
          );

        }

        if (jobSort === "companyZA") {

          return b.company.localeCompare(
            a.company
          );

        }

        return 0;

      });

  // DASHBOARD SUMMARY

  const totalApplications =
    applications.length;

  const selectedCount =
    applications.filter(
      (application) =>
        application.status ===
        "Selected"
    ).length;

  const rejectedCount =
    applications.filter(
      (application) =>
        application.status ===
        "Rejected"
    ).length;

  // FETCH PROFILE

  const fetchProfile = async () => {

    try {

      setProfileLoading(true);

      setProfileError("");

      const response =
        await api.get(
          "/auth/profile"
        );

      setProfile(
        response.data
      );

    } catch (error) {

      console.error(
        "Error fetching profile:",
        error
      );

      setProfileError(
        error.response?.data?.detail ||
        "Failed to load profile."
      );

    } finally {
      setProfileLoading(false);

    }

  };


  const handleOpenProfile = async () => {

    setShowProfile(true);
    setShowSavedJobs(false);
    setShowNotifications(false);
    setShowNotificationPopup(false);
    setSelectedJob(null);
    setSelectedApplicationId(null);
    setSelectedApplicationStatus("");
    setEditingProfile(false);
    setShowChangePassword(false);
    setPasswordMessage("");
    setPasswordError("");
    setProfileMessage("");
    setProfileError("");
    setMessage("");
    setError("");
    await fetchProfile();

  };

  // PROFILE INPUT CHANGE

  const handleProfileChange = (event) => {

    setProfile({
      ...profile,
      [event.target.name]:
        event.target.value
    });

  };

  // SAVE PROFILE

  const handleProfileSubmit =
    async (event) => {

      event.preventDefault();

      try {

        setProfileSaving(true);

        setProfileMessage("");

        setProfileError("");

        const response =
          await api.put(
            "/auth/profile",
            {
              name: profile.name,
              phone: profile.phone,
              education: profile.education,
              skills: profile.skills,
              experience:
                profile.experience,
              bio: profile.bio
            }
          );

        setProfile(
          response.data
        );

        setProfileMessage(
          "Profile updated successfully!"
        );

        setEditingProfile(
          false
        );

      } catch (error) {

        console.error(
          "Error updating profile:",
          error
        );

        setProfileError(
          error.response?.data?.detail ||
          "Failed to update profile."
        );

      } finally {
        setProfileSaving(false);

      }

    };

  // CHANGE PASSWORD

  const handleChangePassword =
    async (event) => {
      event.preventDefault();
      setPasswordMessage("");
      setPasswordError("");

      // FRONTEND VALIDATION
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

      if (
        newPassword.length < 8
      ) {

        setPasswordError(
          "New password must be at least 8 characters long."
        );

        return;

      }

      if (
        newPassword !==
        confirmPassword
      ) {

        setPasswordError(
          "New password and confirm password do not match."
        );

        return;

      }

      if (
        currentPassword ===
        newPassword
      ) {

        setPasswordError(
          "New password must be different from your current password."
        );

        return;

      }

      try {

        setPasswordLoading(
          true
        );

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

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setShowCurrentPassword(
          false
        );

        setShowNewPassword(
          false
        );

        setShowConfirmPassword(
          false
        );

        // successful password change
        setShowChangePassword(
          false
        );

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

        setPasswordLoading(
          false
        );

      }

    };

  // OPEN CHANGE PASSWORD

  const handleOpenChangePassword =
    () => {

      setShowChangePassword(
        true
      );

      setPasswordMessage("");

      setPasswordError("");

    };

  // CANCEL CHANGE PASSWORD

  const handleCancelChangePassword =
    () => {

      setShowChangePassword(
        false
      );

      setCurrentPassword("");

      setNewPassword("");

      setConfirmPassword("");

      setShowCurrentPassword(
        false
      );

      setShowNewPassword(
        false
      );

      setShowConfirmPassword(
        false
      );

      setPasswordMessage("");

      setPasswordError("");

    };

  // UPLOAD RESUME

  const handleResumeUpload =
    async () => {

      if (!resumeFile) {

        setProfileError(
          "Please select a PDF resume."
        );

        return;

      }

      try {

        setResumeUploading(
          true
        );

        setProfileMessage("");

        setProfileError("");

        const formData =
          new FormData();

        formData.append(
          "resume",
          resumeFile
        );

        const response =
          await api.post(
            "/auth/profile/resume",
            formData
          );

        setProfile(
          (previousProfile) => ({
            ...previousProfile,
            resume_filename:
              response.data
                .resume_filename
          })
        );

        setResumeFile(
          null
        );

        setProfileMessage(
          "Resume uploaded successfully!"
        );

      } catch (error) {

        console.error(
          "Error uploading resume:",
          error
        );

        setProfileError(
          error.response?.data?.detail ||
          "Failed to upload resume."
        );

      } finally {

        setResumeUploading(
          false
        );

      }

    };

  // GET INTERVIEW FOR APPLICATION

  const getInterviewForApplication =
    (applicationId) => {

      return interviews.find(
        (interview) =>
          interview.application_id ===
          applicationId
      );

    };

  // NAVBAR

  const renderNavbar = () => {

    return (

      <header className="navbar">

        <h1>
          TalentFlow
        </h1>

        <div className="navbar-actions">

          <button
            type="button"
            className="profile-button"
            onClick={
              handleOpenProfile
            }
          >
            My Profile
          </button>

          <button
            type="button"
            className="notification-button"
            onClick={
              handleOpenNotifications
            }
          >
            Notifications

            {unreadNotificationCount >
              0 && (

              <span className="notification-count">
                {
                  unreadNotificationCount
                }
              </span>

            )}

          </button>

          <button
            type="button"
            className="nav-button"
            onClick={
              handleOpenSavedJobs
            }
          >
            Saved Jobs
          </button>

          <button
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

      </header>

    );

  };

  // NOTIFICATION POPUP

  const renderNotificationPopup =
    () => {

      if (
        !showNotificationPopup ||
        unreadNotificationCount === 0
      ) {

        return null;

      }

      return (

        <div className="notification-popup">

          <div className="notification-popup-content">

            <h3>
              You have a new notification
            </h3>

            <p>
              You have a new TalentFlow
              notification.
            </p>

            <div className="notification-popup-actions">

              <button
                type="button"
                onClick={() => {

                  setShowNotificationPopup(
                    false
                  );

                  handleOpenNotifications();

                }}
              >
                View Notifications
              </button>

              <button
                type="button"
                className="link-button"
                onClick={() =>
                  setShowNotificationPopup(
                    false
                  )
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      );

    };

  // NOTIFICATION PANEL

  const renderNotificationPanel =
    () => {

      if (!showNotifications) {

        return null;

      }

      return (

        <div className="notification-overlay">

          <section className="notification-panel">

            <div className="notification-panel-header">

              <div>

                <h2>
                  Notifications
                </h2>

                <p>
                  Stay updated about your
                  applications.
                </p>

              </div>

              <button
                type="button"
                className="notification-close-button"
                onClick={
                  handleCloseNotifications
                }
              >
                ×
              </button>

            </div>

            {notifications.length === 0 ? (

              <div className="notification-empty">

                <h3>
                  No notifications yet
                </h3>

                <p>
                  You will see application
                  and interview updates here.
                </p>

              </div>

            ) : (

              <div className="notification-list">

                {notifications.map(
                  (notification) => (

                    <div
                      key={
                        notification.id
                      }
                      className={`notification-item ${
                        notification.is_read
                          ? "notification-read"
                          : "notification-unread"
                      }`}
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                    >

                      <div className="notification-item-content">

                        <p className="notification-message">
                          {
                            notification.message
                          }
                        </p>

                        <small>
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </small>

                      </div>

                      {!notification.is_read && (

                        <span className="unread-dot">
                          New
                        </span>

                      )}

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </div>

      );

    };

  // PROFILE CONTENT

  const renderProfile = () => {

    return (

      <main className="jobs-container">

        <button
          type="button"
          className="link-button"
          onClick={
            handleBackToDashboard
          }
        >
          Back to Dashboard
        </button>

        {profileLoading ? (

          <p>
            Loading profile...
          </p>

        ) : (

          <>
            <div className="profile-card">

              <h2>
                My Profile
              </h2>

              <p className="profile-subtitle">
                Your profile information
              </p>

              {profileMessage && (

                <p className="success-message">
                  {profileMessage}
                </p>

              )}

              {profileError && (

                <p className="error-message">
                  {profileError}
                </p>

              )}

              {!editingProfile && (

                <div className="profile-view">

                  <div className="profile-detail">

                    <strong>
                      Full Name
                    </strong>

                    <span>
                      {profile.name ||
                        "Not provided"}
                    </span>

                  </div>

                  <div className="profile-detail">

                    <strong>
                      Email
                    </strong>

                    <span>
                      {profile.email ||
                        "Not provided"}
                    </span>

                  </div>

                  <div className="profile-detail">

                    <strong>
                      Phone
                    </strong>

                    <span>
                      {profile.phone ||
                        "Not provided"}
                    </span>

                  </div>

                  <div className="profile-detail">

                    <strong>
                      Education
                    </strong>

                    <span>
                      {profile.education ||
                        "Not provided"}
                    </span>

                  </div>

                  <div className="profile-detail">

                    <strong>
                      Skills
                    </strong>

                    <span>
                      {profile.skills ||
                        "Not provided"}
                    </span>

                  </div>

                  <div className="profile-detail">

                    <strong>
                      Experience
                    </strong>

                    <span>
                      {profile.experience ||
                        "Not provided"}
                    </span>

                  </div>

                  <div className="profile-detail profile-bio">

                    <strong>
                      About / Bio
                    </strong>

                    <span>
                      {profile.bio ||
                        "Not provided"}
                    </span>

                  </div>

                  <div className="profile-detail">

                    <strong>
                      Resume
                    </strong>

                    <span>
                      {profile.resume_filename
                        ? profile.resume_filename
                        : "Not uploaded"}
                    </span>

                  </div>

                  <button
                    type="button"
                    className="update-profile-button"
                    onClick={() => {

                      setEditingProfile(
                        true
                      );

                      setProfileMessage("");

                      setProfileError("");

                    }}
                  >
                    Update Profile
                  </button>

                </div>

              )}


              {editingProfile && (

                <form
                  onSubmit={
                    handleProfileSubmit
                  }
                  className="profile-form"
                >

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      profile.name
                    }
                    onChange={
                      handleProfileChange
                    }
                    required
                  />

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      profile.email
                    }
                    disabled
                  />

                  <label>
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter phone number"
                    value={
                      profile.phone ||
                      ""
                    }
                    onChange={
                      handleProfileChange
                    }
                  />

                  <label>
                    Education
                  </label>

                  <input
                    type="text"
                    name="education"
                    placeholder="e.g. MCA in Computer Science"
                    value={
                      profile.education ||
                      ""
                    }
                    onChange={
                      handleProfileChange
                    }
                  />

                  <label>
                    Skills
                  </label>

                  <textarea
                    name="skills"
                    placeholder="e.g. Java, Spring Boot, MySQL, React"
                    value={
                      profile.skills ||
                      ""
                    }
                    onChange={
                      handleProfileChange
                    }
                    rows="3"
                  />

                  <label>
                    Experience
                  </label>

                  <input
                    type="text"
                    name="experience"
                    placeholder="e.g. Fresher"
                    value={
                      profile.experience ||
                      ""
                    }
                    onChange={
                      handleProfileChange
                    }
                  />

                  <label>
                    About / Bio
                  </label>

                  <textarea
                    name="bio"
                    placeholder="Tell recruiters about yourself"
                    value={
                      profile.bio ||
                      ""
                    }
                    onChange={
                      handleProfileChange
                    }
                    rows="6"
                  />

                  <label>
                    Resume
                  </label>

                  {profile.resume_filename && (

                    <p className="resume-current">

                      Current Resume:{" "}

                      <strong>
                        {
                          profile.resume_filename
                        }
                      </strong>

                    </p>

                  )}

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(event) =>
                      setResumeFile(
                        event.target.files[0]
                      )
                    }
                  />

                  <button
                    type="button"
                    className="link-button"
                    onClick={
                      handleResumeUpload
                    }
                    disabled={
                      resumeUploading ||
                      !resumeFile
                    }
                  >
                    {resumeUploading
                      ? "Uploading..."
                      : "Upload Resume"}
                  </button>

                  <div className="profile-form-buttons">

                    <button
                      type="submit"
                      disabled={
                        profileSaving
                      }
                    >
                      {profileSaving
                        ? "Saving..."
                        : "Save Profile"}
                    </button>

                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {

                        setEditingProfile(
                          false
                        );

                        setProfileMessage("");

                        setProfileError("");

                        setResumeFile(
                          null
                        );

                      }}
                    >
                      Cancel
                    </button>

                  </div>

                </form>

              )}

            </div>

            <div className="profile-card change-password-card">

              {!showChangePassword ? (

                <>

                  <div className="change-password-collapsed">

                    <div>

                      <h2>
                         Change Password
                      </h2>

                      <p className="profile-subtitle">
                        Update your account password securely.
                      </p>

                    </div>

                    <button
                      type="button"
                      className="update-profile-button change-password-button"
                      onClick={
                        handleOpenChangePassword
                      }
                    >
                      Change Password
                    </button>

                  </div>

                  {passwordMessage && (

                    <p className="success-message password-success-message">
                      {passwordMessage}
                    </p>

                  )}

                  {passwordError && (

                    <p className="error-message password-error-message">
                      {passwordError}
                    </p>

                  )}

                </>

              ) : (

                <>

                  <h2>
                     Change Password
                  </h2>

                  <p className="profile-subtitle">
                    Update your account password securely.
                  </p>

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
                    onSubmit={
                      handleChangePassword
                    }
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
                        value={
                          currentPassword
                        }
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
                        className="link-button"
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
                        value={
                          newPassword
                        }
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
                        className="link-button"
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

                    <small>
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
                        value={
                          confirmPassword
                        }
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
                        className="link-button"
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


                    <div className="change-password-actions">

                      <button
                        type="submit"
                        className="update-profile-button"
                        disabled={
                          passwordLoading
                        }
                      >
                        {passwordLoading
                          ? "Changing Password..."
                          : "Change Password"}
                      </button>

                      <button
                        type="button"
                        className="link-button change-password-cancel"
                        onClick={
                          handleCancelChangePassword
                        }
                        disabled={
                          passwordLoading
                        }
                      >
                        Cancel
                      </button>

                    </div>

                  </form>

                </>

              )}

            </div>

          </>

        )}

      </main>

    );

  };

  // SAVED JOBS CONTENT

  const renderSavedJobs = () => {

    return (

      <section className="saved-jobs-section">

        <div className="section-header">

          <div>

            <h2>
              Saved Jobs
            </h2>

            <p className="section-subtitle">
              Jobs you have saved for later
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={
              handleBackToJobs
            }
          >
            Back to Jobs
          </button>

        </div>

        {savedJobsLoading ? (

          <p>
            Loading saved jobs...
          </p>

        ) : savedJobs.length === 0 ? (

          <div className="empty-state">

            <h3>
              No saved jobs yet
            </h3>

            <p>
              Save jobs you're interested
              in and come back to them later.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                handleOpenJobApplications
              }
            >
              Browse Jobs
            </button>

          </div>

        ) : (

          <div className="jobs-grid">

            {savedJobs.map((job) => (

              <div
                className="job-card"
                key={job.job_id}
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

                  <span className="saved-badge">
                    ★ Saved
                  </span>

                </div>

                <div className="job-info">

                  <p>
                    <strong>
                      Location:
                    </strong>{" "}
                    {job.location}
                  </p>

                  <p>
                    <strong>
                      Experience:
                    </strong>{" "}
                    {job.experience}
                  </p>

                  <p>
                    <strong>
                      Job Type:
                    </strong>{" "}
                    {job.job_type ||
                      "Full-time"}
                  </p>

                  <p>
                    <strong>
                      Skills:
                    </strong>{" "}
                    {job.skills}
                  </p>

                  <p>
                    <strong>
                      Posted On:
                    </strong>{" "}

                    {job.created_at
                      ? new Date(
                          job.created_at
                        ).toLocaleDateString()
                      : "N/A"}

                  </p>

                  {(() => {

                    const originalJob =
                      jobs.find(
                        (item) =>
                          item.id ===
                          job.job_id
                      );

                    return (

                      <>

                        <p>
                          <strong>
                            Application Deadline:
                          </strong>{" "}

                          {originalJob?.closing_date
                            ? new Date(
                                originalJob.closing_date
                              ).toLocaleDateString()
                            : "Not specified"}

                        </p>

                        <p>
                          <strong>
                            Status:
                          </strong>{" "}

                          {originalJob &&
                          isJobExpired(
                            originalJob
                          )
                            ? "Expired"
                            : "Open"}

                        </p>

                      </>

                    );

                  })()}

                </div>

                <div className="job-card-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {

                      const originalJob =
                        jobs.find(
                          (item) =>
                            item.id ===
                            job.job_id
                        );

                      if (originalJob) {

                        setSelectedJob(
                          originalJob
                        );

                        setShowSavedJobs(
                          false
                        );

                        setActiveSection(
                          "jobs"
                        );

                      }

                    }}
                  >
                    View Details
                  </button>

                  <button
                    type="button"
                    className="save-job-button"
                    onClick={() =>
                      handleSaveJob(
                        job.job_id
                      )
                    }
                    disabled={
                      savingJobId ===
                      job.job_id
                    }
                  >
                    {savingJobId ===
                    job.job_id
                      ? "Removing..."
                      : "★ Remove"}
                  </button>

                  {hasApplied(
                    job.job_id
                  ) ? (

                    <button
                      type="button"
                      className="apply-button applied"
                      disabled
                    >
                      Applied
                    </button>

                  ) : (() => {

                    const originalJob =
                      jobs.find(
                        (item) =>
                          item.id ===
                          job.job_id
                      );

                    return originalJob &&
                      isJobExpired(
                        originalJob
                      ) ? (

                      <button
                        type="button"
                        className="apply-button"
                        disabled
                      >
                        Application Closed
                      </button>

                    ) : (

                      <button
                        type="button"
                        className="apply-button"
                        onClick={() =>
                          handleApply(
                            job.job_id
                          )
                        }
                        disabled={
                          applicationLoading ===
                          job.job_id
                        }
                      >
                        {applicationLoading ===
                        job.job_id
                          ? "Applying..."
                          : "Apply Now"}
                      </button>

                    );

                  })()}

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    );

  };

  // AVAILABLE JOBS

  const renderAvailableJobs = () => {

    return (

      <>

        <div className="section-header jobs-section-header">

          <div>

            <h2>
              Job Applications
            </h2>

            <p className="section-subtitle">
              Browse available opportunities and apply for jobs.
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={
              handleBackToDashboard
            }
          >
            ← Dashboard
          </button>

        </div>

        <div className="job-filters">

          <input
            type="text"
            placeholder="Search by title, company or skills"
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

            {[...new Set(
              jobs.map(
                (job) =>
                  job.location
              )
            )].map((location) => (

              <option
                key={location}
                value={location}
              >
                {location}
              </option>

            ))}

          </select>

          <select
            value={selectedExperience}
            onChange={(e) =>
              setSelectedExperience(
                e.target.value
              )
            }
          >

            <option value="">
              All Experience
            </option>

            {[...new Set(
              jobs.map(
                (job) =>
                  job.experience
              )
            )].map((experience) => (

              <option
                key={experience}
                value={experience}
              >
                {experience}
              </option>

            ))}

          </select>

          <select
            value={jobSort}
            onChange={(e) =>
              setJobSort(
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

            <option value="companyAZ">
              Company A–Z
            </option>

            <option value="companyZA">
              Company Z–A
            </option>

          </select>

          <button
            type="button"
            className="link-button"
            onClick={() => {

              setSearchTerm("");
              setSelectedLocation("");
              setSelectedExperience("");
              setJobSort("newest");

            }}
          >
            Clear Filters
          </button>

        </div>

        {loading ? (

          <p>
            Loading jobs...
          </p>

        ) : jobs.length === 0 ? (

          <p>
            No jobs available.
          </p>

        ) : filteredJobs.length === 0 ? (

          <p>
            No jobs found related to your search.
          </p>

        ) : (

          filteredJobs.map((job) => {

            const alreadyApplied =
              hasApplied(job.id);

            return (

              <div
                className="job-card"
                key={job.id}
              >

                <h3>
                  {job.title}
                </h3>

                <p>
                  <strong>
                    Company:
                  </strong>{" "}
                  {job.company}
                </p>

                <p>
                  <strong>
                    Location:
                  </strong>{" "}
                  {job.location}
                </p>

                <p>
                  <strong>
                    Experience:
                  </strong>{" "}
                  {job.experience}
                </p>

                <p>
                  <strong>
                    Job Type:
                  </strong>{" "}
                  {job.job_type ||
                    "Full-time"}
                </p>

                <p>
                  <strong>
                    Skills:
                  </strong>{" "}
                  {job.skills}
                </p>

                <p>
                  <strong>
                    Posted On:
                  </strong>{" "}

                  {new Date(
                    job.created_at
                  ).toLocaleDateString()}

                </p>

                <p>
                  <strong>
                    Application Deadline:
                  </strong>{" "}

                  {job.closing_date
                    ? new Date(
                        job.closing_date
                      ).toLocaleDateString()
                    : "Not specified"}

                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}

                  {isJobExpired(job)
                    ? "Expired"
                    : "Open"}

                </p>

                <button
                  type="button"
                  className="link-button"
                  onClick={() =>
                    setSelectedJob(job)
                  }
                >
                  View Details
                </button>

                <button
                  type="button"
                  className="save-job-button"
                  onClick={() =>
                    handleSaveJob(
                      job.id
                    )
                  }
                  disabled={
                    savingJobId ===
                    job.id
                  }
                >
                  {savingJobId ===
                  job.id
                    ? "Saving..."
                    : isJobSaved(job.id)
                      ? "★ Saved"
                      : "☆ Save Job"}
                </button>

                {alreadyApplied ? (

                  <button
                    className="apply-button"
                    disabled
                  >
                     Applied
                  </button>

                ) : isJobExpired(job) ? (

                  <button
                    className="apply-button"
                    disabled
                  >
                    Application Closed
                  </button>

                ) : (

                  <button
                    className="apply-button"
                    onClick={() =>
                      handleApply(
                        job.id
                      )
                    }
                    disabled={
                      applicationLoading ===
                      job.id
                    }
                  >
                    {applicationLoading ===
                    job.id
                      ? "Applying..."
                      : "Apply Now"}
                  </button>

                )}

              </div>

            );

          })

        )}

      </>

    );

  };

  // JOB DETAILS

  const renderJobDetails = () => {

    if (!selectedJob) {

      return null;

    }

    return (

      <section className="job-details-section">

        <button
          type="button"
          className="link-button"
          onClick={
            handleBackToJobs
          }
        >
           Back to Jobs
        </button>

        <div className="job-card">

          <h2>
            {selectedJob.title}
          </h2>

          <p>
            <strong>
              Company:
            </strong>{" "}
            {selectedJob.company}
          </p>

          <p>
            <strong>
              Location:
            </strong>{" "}
            {selectedJob.location}
          </p>

          <p>
            <strong>
              Experience:
            </strong>{" "}
            {selectedJob.experience}
          </p>

          <p>
            <strong>
              Job Type:
            </strong>{" "}
            {selectedJob.job_type ||
              "Full-time"}
          </p>

          <p>
            <strong>
              Skills:
            </strong>{" "}
            {selectedJob.skills}
          </p>

          <p>
            <strong>
              Posted On:
            </strong>{" "}

            {new Date(
              selectedJob.created_at
            ).toLocaleDateString()}

          </p>

          <p>
            <strong>
              Application Deadline:
            </strong>{" "}

            {selectedJob.closing_date
              ? new Date(
                  selectedJob.closing_date
                ).toLocaleDateString()
              : "Not specified"}

          </p>

          <p>
            <strong>
              Status:
            </strong>{" "}

            {isJobExpired(
              selectedJob
            )
              ? "Expired"
              : "Open"}

          </p>

          <hr />

          <h3>
            Job Description
          </h3>

          <p>
            {selectedJob.description}
          </p>

          <button
            type="button"
            className="save-job-button"
            onClick={() =>
              handleSaveJob(
                selectedJob.id
              )
            }
            disabled={
              savingJobId ===
              selectedJob.id
            }
          >
            {savingJobId ===
            selectedJob.id
              ? "Saving..."
              : isJobSaved(
                  selectedJob.id
                )
                ? "★ Saved"
                : "☆ Save Job"}
          </button>

          {hasApplied(
            selectedJob.id
          ) ? (

            <button
              className="apply-button"
              disabled
            >
               Applied
            </button>

          ) : isJobExpired(
              selectedJob
            ) ? (

            <button
              className="apply-button"
              disabled
            >
              Application Closed
            </button>

          ) : (

            <button
              className="apply-button"
              onClick={() =>
                handleApply(
                  selectedJob.id
                )
              }
              disabled={
                applicationLoading ===
                selectedJob.id
              }
            >
              {applicationLoading ===
              selectedJob.id
                ? "Applying..."
                : "Apply Now"}
            </button>

          )}

        </div>

      </section>

    );

  };

  // MY APPLICATIONS
  const renderApplications = () => {

    return (

      <section className="applications-section">

        <div className="applications-heading">

          <div>

            <h2>
              {selectedApplicationId !== null
                ? "Application Update"
                : "My Applications"}
            </h2>

            <p>
              {selectedApplicationId !== null
                ? "Here is the application related to your notification."
                : "Track the status of your job applications."}
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={
              handleBackToDashboard
            }
          >
             Dashboard
          </button>

        </div>

        {selectedApplicationId !== null && (

          <button
            type="button"
            className="link-button"
            onClick={
              handleBackToAllApplications
            }
          >
             Back to All Applications
          </button>

        )}

        <div className="application-filter">

          <label>

            <strong>
              Filter by Status:
            </strong>

          </label>

          <select
            value={
              selectedApplicationStatus
            }
            onChange={(e) =>
              setSelectedApplicationStatus(
                e.target.value
              )
            }
          >

            <option value="">
              All Statuses
            </option>

            <option value="Applied">
              Applied
            </option>

            <option value="Shortlisted">
              Shortlisted
            </option>

            <option value="Interview">
              Interview
            </option>

            <option value="Selected">
              Selected
            </option>

            <option value="Rejected">
              Rejected
            </option>

          </select>

        </div>

        {applications.length === 0 ? (

          <p>
            You have not applied for any jobs yet.
          </p>

        ) : filteredApplications.length === 0 ? (

          <p>
            No applications with "
            {selectedApplicationStatus}"
            status.
          </p>

        ) : (

          filteredApplications.map(
            (application) => {

              const job =
                jobs.find(
                  (job) =>
                    job.id ===
                    application.job_id
                );

              return (

                <div
                  className="job-card application-card"
                  key={application.id}
                >

                  <h3>
                    {job
                      ? job.title
                      : `Job #${application.job_id}`}
                  </h3>

                  {job && (

                    <p>
                      <strong>
                        Company:
                      </strong>{" "}
                      {job.company}
                    </p>

                  )}

                  {job && (

                    <p>
                      <strong>
                        Location:
                      </strong>{" "}
                      {job.location}
                    </p>

                  )}

                  <p>

                    <strong>
                      Status:
                    </strong>{" "}

                    <span
                      className={`status-badge status-${application.status.toLowerCase()}`}
                    >
                      {application.status}
                    </span>

                  </p>

                  <p>

                    <strong>
                      Applied On:
                    </strong>{" "}

                    {new Date(
                      application.applied_at
                    ).toLocaleDateString()}

                  </p>


                  <div className="application-timeline">

                    <h4>
                      Application Timeline
                    </h4>

                    {getTimelineForApplication(
                      application.id
                    ).length === 0 ? (

                      <p className="timeline-empty">
                        No timeline updates available.
                      </p>

                    ) : (

                      <div className="timeline-list">

                        {getTimelineForApplication(
                          application.id
                        ).map(
                          (item) => (

                            <div
                              className="timeline-item"
                              key={item.id}
                            >

                              <div className="timeline-marker">
                                <span></span>
                              </div>

                              <div className="timeline-content">

                                <h5>
                                  {item.status}
                                </h5>

                                <p>

                                  {item.status ===
                                    "Applied" &&
                                    "Application submitted successfully."}

                                  {item.status ===
                                    "Shortlisted" &&
                                    "Your application has been shortlisted."}

                                  {item.status ===
                                    "Interview" &&
                                    "Your application has moved to the interview stage."}

                                  {item.status ===
                                    "Selected" &&
                                    "Congratulations! You have been selected."}

                                  {item.status ===
                                    "Rejected" &&
                                    "Your application was not selected for this opportunity."}

                                </p>

                                <small>
                                  {new Date(
                                    item.changed_at
                                  ).toLocaleString()}
                                </small>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                  {getInterviewForApplication(
                    application.id
                  ) && (

                    <div className="interview-card">

                      <h4>
                         Interview Scheduled
                      </h4>

                      {(() => {

                        const interview =
                          getInterviewForApplication(
                            application.id
                          );
                        return (
                          <>

                            <p>
                              <strong>
                                Date:
                              </strong>{" "}

                              {new Date(
                                interview.interview_date
                              ).toLocaleDateString()}

                            </p>

                            <p>
                              <strong>
                                Time:
                              </strong>{" "}

                              {interview
                                .interview_time
                                ?.slice(0, 5)}

                            </p>

                            <p>
                              <strong>
                                Mode:
                              </strong>{" "}

                              {interview.mode}

                            </p>

                            {interview.mode ===
                              "Online" &&
                              interview.meeting_link && (

                                <p>

                                  <strong>
                                    Meeting Link:
                                  </strong>{" "}

                                  <a
                                    href={
                                      interview.meeting_link
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Join Interview
                                  </a>

                                </p>

                              )}

                            {interview.mode ===
                              "In-person" &&
                              interview.location && (

                                <p>

                                  <strong>
                                    Location:
                                  </strong>{" "}

                                  {interview.location}

                                </p>

                              )}

                            {interview.notes && (

                              <p>

                                <strong>
                                  Notes:
                                </strong>{" "}

                                {interview.notes}

                              </p>

                            )}

                          </>

                        );

                      })()}

                    </div>

                  )}

                </div>

              );

            }
          )

        )}

      </section>

    );

  };
  // MAIN RENDER

  return (

    <div className="candidate-dashboard">

      {renderNavbar()}

      {renderNotificationPopup()}


      {renderNotificationPanel()}


      {showProfile ? (

        renderProfile()

      ) : (

        <main className="jobs-container">

          {activeSection === "dashboard" &&
            !showSavedJobs &&
            !selectedJob && (
              <>
                <h2>
                  Candidate Dashboard
                </h2>
                <p>
                  Find jobs and manage your applications.
                </p>

                <div className="dashboard-stats">

                  <div className="stat-card">

                    <h3>
                      {totalApplications}
                    </h3>

                    <p>
                      Total Applications
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


                <div className="candidate-section-buttons">

                  <button
                    type="button"
                    className="candidate-section-button candidate-section-button-primary"
                    onClick={
                      handleOpenJobApplications
                    }
                  >
                    <span>
                      <strong>
                        Job Applications
                      </strong>

                      <small>
                        Browse and apply for available jobs
                      </small>
                    </span>

                    <span className="candidate-section-button-arrow">
                      →
                    </span>
                  </button>
                  <button
                    type="button"
                    className="candidate-section-button candidate-section-button-secondary"
                    onClick={
                      handleOpenMyApplications
                    }
                  >

                    <span className="candidate-section-button-icon">                   </span>

                    <span>
                      <strong> My Applications</strong>
                      <small>Track your applications and status  </small>
                    </span>
                    <span className="candidate-section-button-arrow">
                      →
                    </span>
                  </button>
                </div>
              </>
            )}

          {message && (
            <p className="success-message">
              {message}
            </p>
          )}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {showSavedJobs && renderSavedJobs()}

          {!showSavedJobs && selectedJob && activeSection === "jobs" && renderJobDetails()}

          {!showSavedJobs && !selectedJob && activeSection === "jobs" && renderAvailableJobs()}

          {!showSavedJobs && !selectedJob && activeSection === "applications" && renderApplications()}

        </main>
      )}
    </div>
  );

}
export default CandidateDashboard;