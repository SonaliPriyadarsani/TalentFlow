import { useEffect, useState } from "react";
import api from "./services/api";

function ApplicationsPage({ job, onBack }) {

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // CANDIDATE PROFILE STATES
  const [selectedCandidate, setSelectedCandidate] =
    useState(null);

  const [candidateProfile, setCandidateProfile] =
    useState(null);

  const [profileLoading, setProfileLoading] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

   // INTERVIEW STATES
  const [interviews, setInterviews] = useState([]);

  const [showInterviewForm, setShowInterviewForm] =
    useState(null);

  const [interviewLoading, setInterviewLoading] =
    useState(false);

  const [interviewForm, setInterviewForm] = useState({
    interview_date: "",
    interview_time: "",
    mode: "Online",
    meeting_link: "",
    location: "",
    notes: ""
  });

  // INTERVIEW NOTES STATES

  const [editingNotes, setEditingNotes] =
    useState(null);

  const [notesText, setNotesText] =
    useState("");

  const [notesLoading, setNotesLoading] =
    useState(false);


  // FETCH APPLICATIONS
  const fetchApplications = async () => {

    try {

      const response = await api.get(
        `/applications/job/${job.id}`
      );

      setApplications(response.data);

    } catch (error) {

      console.error(
        "Error fetching applications:",
        error
      );

    } finally {

      setLoading(false);

    }
  };


  // FETCH INTERVIEWS

  const fetchInterviews = async () => {

    try {

      const response = await api.get(
        `/applications/interview/job/${job.id}`
      );

      setInterviews(response.data);

    } catch (error) {

      console.error(
        "Error fetching interviews:",
        error
      );

    }

  };


  // LOAD APPLICATIONS + INTERVIEWS

  useEffect(() => {

    const loadData = async () => {

      await fetchApplications();

      await fetchInterviews();

    };

    loadData();

  }, [job.id]);


  // UPDATE APPLICATION STATUS

  const handleStatusChange = async (
    applicationId,
    newStatus
  ) => {

    try {

      const response = await api.put(
        `/applications/${applicationId}/status`,
        {
          status: newStatus
        }
      );

      setApplications(
        (previousApplications) =>

          previousApplications.map(
            (application) =>

              application.id === applicationId
                ? response.data
                : application
          )
      );

    } catch (error) {

      console.error(
        "Error updating application status:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Failed to update application status."
      );

    }

  };


  // FILTER APPLICATIONS

  const filteredApplications =
    applications.filter(
      (application) => {

        const search =
          searchTerm.toLowerCase();

        const matchesSearch =
          application.candidate_name
            .toLowerCase()
            .includes(search) ||

          application.candidate_email
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          selectedStatus === "" ||
          application.status === selectedStatus;

        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );


  // VIEW CANDIDATE PROFILE

  const handleViewProfile = async (
    candidateId
  ) => {

    try {

      setSelectedCandidate(candidateId);

      setCandidateProfile(null);

      setProfileLoading(true);

      setProfileError("");

      const response = await api.get(
        `/auth/candidate/${candidateId}/profile`
      );

      setCandidateProfile(
        response.data
      );

    } catch (error) {

      console.error(
        "Error fetching candidate profile:",
        error
      );

      setProfileError(
        error.response?.data?.detail ||
        "Failed to load candidate profile."
      );

    } finally {

      setProfileLoading(false);

    }

  };


  // VIEW RESUME

  const handleViewResume = async () => {

    if (!selectedCandidate) {
      return;
    }

    try {

      const response = await api.get(
        `/auth/candidate/${selectedCandidate}/resume`,
        {
          responseType: "blob"
        }
      );

      const fileURL =
        window.URL.createObjectURL(
          new Blob(
            [response.data],
            {
              type: "application/pdf"
            }
          )
        );

      window.open(
        fileURL,
        "_blank"
      );

    } catch (error) {

      console.error(
        "Error opening resume:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Failed to open resume."
      );

    }

  };


  // BACK TO APPLICATIONS

  const handleBackToApplications = () => {

    setSelectedCandidate(null);

    setCandidateProfile(null);

    setProfileError("");

  };


  // GET INTERVIEW FOR APPLICATION

  const getInterviewForApplication = (
    applicationId
  ) => {

    return interviews.find(
      (interview) =>
        interview.application_id === applicationId
    );

  };


  // OPEN INTERVIEW FORM

  const openScheduleInterview = (
    application
  ) => {

    const existingInterview =
      getInterviewForApplication(
        application.id
      );

    if (existingInterview) {

      setInterviewForm({

        interview_date:
          existingInterview.interview_date,

        interview_time:
          existingInterview.interview_time
            ? existingInterview.interview_time.slice(0, 5)
            : "",

        mode:
          existingInterview.mode ||
          "Online",

        meeting_link:
          existingInterview.meeting_link ||
          "",

        location:
          existingInterview.location ||
          "",

        notes:
          existingInterview.notes ||
          ""

      });

    } else {

      setInterviewForm({

        interview_date: "",

        interview_time: "",

        mode: "Online",

        meeting_link: "",

        location: "",

        notes: ""

      });

    }

    setShowInterviewForm(
      application.id
    );

  };


  // INTERVIEW FORM CHANGE

  const handleInterviewChange = (
    event
  ) => {

    const {
      name,
      value
    } = event.target;

    setInterviewForm(
      (previous) => ({
        ...previous,
        [name]: value
      })
    );

  };


  // SUBMIT INTERVIEW

  const handleInterviewSubmit = async (
    application
  ) => {

    try {

      setInterviewLoading(true);

      const existingInterview =
        getInterviewForApplication(
          application.id
        );

      const payload = {

        interview_date:
          interviewForm.interview_date,

        interview_time:
          interviewForm.interview_time,

        mode:
          interviewForm.mode,

        meeting_link:
          interviewForm.mode === "Online"
            ? interviewForm.meeting_link
            : null,

        location:
          interviewForm.mode === "In-person"
            ? interviewForm.location
            : null,

        notes:
          interviewForm.notes ||
          null

      };


      // RESCHEDULE
      if (existingInterview) {

        await api.put(
          `/applications/interview/${existingInterview.id}`,
          payload
        );

        alert(
          "Interview rescheduled successfully."
        );

      }

      // NEW INTERVIEW
      else {

        await api.post(
          `/applications/interview/${application.id}`,
          payload
        );

        alert(
          "Interview scheduled successfully."
        );

      }


      setShowInterviewForm(null);

      await fetchInterviews();

    } catch (error) {

      console.error(
        "Error scheduling interview:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Failed to schedule interview."
      );

    } finally {

      setInterviewLoading(false);

    }

  };


  // START EDITING INTERVIEW NOTES
  const startEditingNotes = (
    interview
  ) => {

    setEditingNotes(
      interview.id
    );

    setNotesText(
      interview.notes || ""
    );

  };


  // CANCEL EDITING NOTES
  const cancelEditingNotes = () => {

    setEditingNotes(null);

    setNotesText("");

  };


  // SAVE INTERVIEW NOTES
  const saveInterviewNotes = async (
    interview
  ) => {

    try {

      setNotesLoading(true);

      const response = await api.put(
        `/applications/interview/${interview.id}/notes`,
        {
          notes:
            notesText.trim() || null
        }
      );

      setInterviews(
        (previousInterviews) =>

          previousInterviews.map(
            (item) =>

              item.id === interview.id
                ? response.data
                : item
          )
      );

      setEditingNotes(null);

      setNotesText("");

      alert(
        "Interview notes saved successfully."
      );

    } catch (error) {

      console.error(
        "Error saving interview notes:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Failed to save interview notes."
      );

    } finally {

      setNotesLoading(false);

    }

  };


  // CANDIDATE PROFILE PAGE
  if (selectedCandidate) {

    return (

  <div className="recruiter-dashboard applications-page">
        <header className="navbar">

          <h1>
            TalentFlow
          </h1>

        </header>


        <main className="jobs-container">

          <button
            type="button"
            className="link-button"
            onClick={
              handleBackToApplications
            }
          >
            ← Back to Applications
          </button>


          <div className="profile-card">

            <h2>
              Candidate Profile
            </h2>


            <p className="profile-subtitle">
              Candidate information
            </p>


            {profileLoading ? (

              <p>
                Loading candidate profile...
              </p>

            ) : profileError ? (

              <p className="error-message">
                {profileError}
              </p>

            ) : candidateProfile ? (

              <div className="profile-view">


                <div className="profile-detail">

                  <strong>
                    Full Name
                  </strong>

                  <span>
                    {candidateProfile.name ||
                      "Not provided"}
                  </span>

                </div>


                <div className="profile-detail">

                  <strong>
                    Email
                  </strong>

                  <span>
                    {candidateProfile.email ||
                      "Not provided"}
                  </span>

                </div>


                <div className="profile-detail">

                  <strong>
                    Phone
                  </strong>

                  <span>
                    {candidateProfile.phone ||
                      "Not provided"}
                  </span>

                </div>


                <div className="profile-detail">

                  <strong>
                    Education
                  </strong>

                  <span>
                    {candidateProfile.education ||
                      "Not provided"}
                  </span>

                </div>


                <div className="profile-detail">

                  <strong>
                    Skills
                  </strong>

                  <span>
                    {candidateProfile.skills ||
                      "Not provided"}
                  </span>

                </div>


                <div className="profile-detail">

                  <strong>
                    Experience
                  </strong>

                  <span>
                    {candidateProfile.experience ||
                      "Not provided"}
                  </span>

                </div>


                <div className="profile-detail profile-bio">

                  <strong>
                    About / Bio
                  </strong>

                  <span>
                    {candidateProfile.bio ||
                      "Not provided"}
                  </span>

                </div>


                <div className="profile-detail">

                  <strong>
                    Resume
                  </strong>

                  <span>

                    {candidateProfile.resume_filename ? (

                      <button
                        type="button"
                        className="link-button"
                        onClick={
                          handleViewResume
                        }
                      >
                        View Resume
                      </button>

                    ) : (

                      "Not uploaded"

                    )}

                  </span>

                </div>

              </div>

            ) : null}

          </div>

        </main>

      </div>

    );

  }


  // NORMAL APPLICATIONS PAGE
  return (

  <div className="recruiter-dashboard applications-page">
      <header className="navbar">

        <h1>
          TalentFlow
        </h1>

      </header>


      <main className="jobs-container">


        <button
          className="link-button"
          onClick={onBack}
        >
          ← Back to Jobs
        </button>


        <h2>
          Applications for:
        </h2>


        <h3>
          {job.title}
        </h3>



        <div className="application-filters">

          <input
            type="text"
            placeholder="Search candidate by name or email"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />


          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(
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


          <button
            type="button"
            className="link-button"
            onClick={() => {

              setSearchTerm("");

              setSelectedStatus("");

            }}
          >
            Clear Filters
          </button>

        </div>

        {loading ? (

          <p>
            Loading applications...
          </p>

        ) : applications.length === 0 ? (

          <div className="job-card">

            <h3>
              No applications yet
            </h3>

            <p>
              No candidates have applied
              for this job.
            </p>

          </div>

        ) : filteredApplications.length === 0 ? (

          <div className="job-card">

            <h3>
              No matching candidates
            </h3>

            <p>
              No candidates match your
              search or selected status.
            </p>

          </div>

        ) : (

          filteredApplications.map(
            (application) => {

              const interview =
                getInterviewForApplication(
                  application.id
                );

              return (

                <div
                  className="job-card"
                  key={application.id}
                >
                  <h3>
                    {application.candidate_name}
                  </h3>
                  <p>

                    <strong>
                      Email:
                    </strong>{" "}

                    {application.candidate_email}

                  </p>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() =>
                      handleViewProfile(
                        application.candidate_id
                      )
                    }
                  >
                    View Profile
                  </button>
                  <p>

                    <strong>
                      Applied On:
                    </strong>{" "}

                    {new Date(
                      application.applied_at
                    ).toLocaleDateString()}

                  </p>
                  <p>

                    <strong>
                      Current Status:
                    </strong>{" "}

                    <span
                      className={`status-badge status-${application.status.toLowerCase()}`}
                    >
                      {application.status}
                    </span>

                  </p>
                  <label>

                    <strong>
                      Update Status:
                    </strong>{" "}

                    <select
                      value={
                        application.status
                      }
                      onChange={(event) =>
                        handleStatusChange(
                          application.id,
                          event.target.value
                        )
                      }
                    >

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

                  </label>

                  <div className="interview-section">

                    <h4>
                       Interview
                    </h4>


                    {interview ? (

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

                          {interview.interview_time
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

                        <div className="interview-notes">

                          <h5>
                             Recruiter Interview Notes
                          </h5>


                          {editingNotes === interview.id ? (

                            <>

                              <textarea
  rows="5"
  placeholder="Add private interview notes about the candidate..."
  value={notesText}
  onChange={(event) => setNotesText(event.target.value)}
  className="interview-notes-textarea"
/>


                              <div className="interview-action-row">

                                <button
                                  type="button"
                                  className="apply-button"
                                  disabled={
                                    notesLoading
                                  }
                                  onClick={() =>
                                    saveInterviewNotes(
                                      interview
                                    )
                                  }
                                >
                                  {notesLoading
                                    ? "Saving..."
                                    : " Save Notes"}
                                </button>


                                <button
                                  type="button"
                                  className="link-button"
                                  onClick={
                                    cancelEditingNotes
                                  }
                                  disabled={
                                    notesLoading
                                  }
                                >
                                  Cancel
                                </button>

                              </div>

                            </>

                          ) : (

                            <>

                              {interview.notes ? (

                                <p
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    marginTop: "8px"
                                  }}
                                >
                                  {interview.notes}
                                </p>

                              ) : (

                                <p
                                  style={{
                                    color: "#777",
                                    marginTop: "8px"
                                  }}
                                >
                                  No interview notes added yet.
                                </p>

                              )}


                              <button
                                type="button"
                                className="link-button"
                                onClick={() =>
                                  startEditingNotes(
                                    interview
                                  )
                                }
                              >
                                {interview.notes
                                  ? " Edit Notes"
                                  : " Add Notes"}
                              </button>

                            </>

                          )}

                        </div>

                        <button
                          type="button"
                          className="apply-button"
                          onClick={() =>
                            openScheduleInterview(
                              application
                            )
                          }
                        >
                          Reschedule Interview
                        </button>

                      </>

                    ) : (

                      <button
                        type="button"
                        className="apply-button"
                        onClick={() =>
                          openScheduleInterview(
                            application
                          )
                        }
                      >
                         Schedule Interview
                      </button>

                    )}

                  </div>



                  {showInterviewForm ===
                    application.id && (

                   <div className="interview-form-section">

                      <h4>

                        {getInterviewForApplication(
                          application.id
                        )
                          ? "Reschedule Interview"
                          : "Schedule Interview"}

                      </h4>

                      <label>
                        Interview Date
                      </label>

                      <input
                        type="date"
                        name="interview_date"
                        value={
                          interviewForm.interview_date
                        }
                        onChange={
                          handleInterviewChange
                        }
                        required
                      />
                      <label>
                        Interview Time
                      </label>

                      <input
                        type="time"
                        name="interview_time"
                        value={
                          interviewForm.interview_time
                        }
                        onChange={
                          handleInterviewChange
                        }
                        required
                      />
                      <label>
                        Interview Mode
                      </label>

                      <select
                        name="mode"
                        value={
                          interviewForm.mode
                        }
                        onChange={
                          handleInterviewChange
                        }
                      >

                        <option value="Online">
                          Online
                        </option>

                        <option value="In-person">
                          In-person
                        </option>

                      </select>

                      {interviewForm.mode ===
                        "Online" && (

                        <>
                          <label>
                            Meeting Link
                          </label>

                          <input
                            type="url"
                            name="meeting_link"
                            placeholder="https://meet.google.com/..."
                            value={
                              interviewForm.meeting_link
                            }
                            onChange={
                              handleInterviewChange
                            }
                            required
                          />
                        </>

                      )}

                      {interviewForm.mode ===
                        "In-person" && (

                        <>
                          <label>
                            Interview Location
                          </label>

                          <input
                            type="text"
                            name="location"
                            placeholder="Office / Interview Location"
                            value={
                              interviewForm.location
                            }
                            onChange={
                              handleInterviewChange
                            }
                            required
                          />
                        </>

                      )}
                      <label>
                        Interview Notes
                      </label>

                      <textarea
                        name="notes"
                        placeholder="Add interview instructions or notes"
                        rows="4"
                        value={
                          interviewForm.notes
                        }
                        onChange={
                          handleInterviewChange
                        }
                      />
                         <div className="interview-action-row">

                        <button
                          type="button"
                          className="apply-button"
                          disabled={
                            interviewLoading
                          }
                          onClick={() =>
                            handleInterviewSubmit(
                              application
                            )
                          }
                        >

                          {interviewLoading
                            ? "Saving..."
                            : getInterviewForApplication(
                                application.id
                              )
                              ? "Reschedule Interview"
                              : "Schedule Interview"}

                        </button>


                        <button
                          type="button"
                          className="link-button"
                          onClick={() =>
                            setShowInterviewForm(
                              null
                            )
                          }
                        >
                          Cancel
                        </button>

                      </div>

                    </div>

                  )}

                </div>

              );

            }

          )

        )}

      </main>

    </div>

  );

}

export default ApplicationsPage;