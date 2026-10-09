
import { useState } from "react";
import api from "./services/api";
import "./RecruiterDashboard.css";

function CreateJob({ onJobCreated, onCancel }) {
  const initialFormData = {
    title: "",
    description: "",
    location: "",
    experience: "",
    skills: "",
    company: "",
    closing_date: "",
    job_type: "Full-time",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");

    try {
      const response = await api.post("/jobs/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Job published successfully!");

      setFormData({ ...initialFormData });

      if (onJobCreated) {
        onJobCreated(response.data);
      }
    } catch (error) {
      console.error("Error creating job:", error);

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        setError(
          typeof detail === "string"
            ? detail
            : JSON.stringify(detail)
        );
      } else {
        setError("Unable to create the job. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recruiter-dashboard create-job-page">
      <div className="create-job-container">

        <div className="create-job-heading">
          <div className="create-job-heading-icon">
            <span aria-hidden="true">✦</span>
          </div>

          <div>
            <p className="create-job-eyebrow">
              RECRUITER WORKSPACE
            </p>
            <h1>Create a New Job</h1>
            <p className="create-job-subtitle">
              Find the right talent by sharing your next opportunity.
            </p>
          </div>
        </div>

        <div className="create-job-card">
          <div className="create-job-card-header">
            <div>
              <h2>Job Details</h2>
              <p>
                Complete the information below to publish your opening.
              </p>
            </div>

            <span className="create-job-required">
              * Required fields
            </span>
          </div>

          {success && (
            <div className="create-job-alert create-job-alert-success"
                 role="status">
              <span aria-hidden="true">✓</span>
              {success}
            </div>
          )}

          {error && (
            <div className="create-job-alert create-job-alert-error"
                 role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-job-form">

            <div className="create-job-section-title">
              <span className="create-job-section-number">01</span>
              <div>
                <h3>Basic Information</h3>
                <p>Introduce the role and your company.</p>
              </div>
            </div>

            <div className="create-job-grid">

              <div className="create-job-field">
                <label htmlFor="job-title">Job Title *</label>
                <input
                  id="job-title"
                  type="text"
                  name="title"
                  placeholder="e.g. Java Developer"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="create-job-input"
                />
              </div>

              <div className="create-job-field">
                <label htmlFor="job-company">Company Name *</label>
                <input
                  id="job-company"
                  type="text"
                  name="company"
                  placeholder="Enter company name"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="create-job-input"
                />
              </div>

              <div className="create-job-field">
                <label htmlFor="job-location">Job Location *</label>
                <input
                  id="job-location"
                  type="text"
                  name="location"
                  placeholder="e.g. Bengaluru, India"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="create-job-input"
                />
              </div>

              <div className="create-job-field">
                <label htmlFor="job-experience">
                  Experience Required *
                </label>
                <input
                  id="job-experience"
                  type="text"
                  name="experience"
                  placeholder="e.g. Fresher / 0–2 years"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  className="create-job-input"
                />
              </div>

              <div className="create-job-field">
                <label htmlFor="job-type">Employment Type *</label>
                <select
                  id="job-type"
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleChange}
                  required
                  className="create-job-input create-job-select"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>

              <div className="create-job-field">
                <label htmlFor="job-deadline">
                  Application Deadline *
                </label>
                <input
                  id="job-deadline"
                  type="date"
                  name="closing_date"
                  value={formData.closing_date}
                  onChange={handleChange}
                  min={new Date().toLocaleDateString("en-CA")}
                  required
                  className="create-job-input"
                />
                <small>
                  Select today or a future date.
                </small>
              </div>

            </div>

            <div className="create-job-divider" />

            <div className="create-job-section-title">
              <span className="create-job-section-number">02</span>
              <div>
                <h3>Role Description</h3>
                <p>Help candidates understand the opportunity.</p>
              </div>
            </div>

            <div className="create-job-field create-job-full-width">
              <label htmlFor="job-description">
                Job Description *
              </label>
              <textarea
                id="job-description"
                name="description"
                placeholder="Describe the role, responsibilities, expectations, and what the candidate will work on..."
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className="create-job-input create-job-textarea"
              />
            </div>

            <div className="create-job-field create-job-full-width">
              <label htmlFor="job-skills">
                Required Skills *
              </label>
              <input
                id="job-skills"
                type="text"
                name="skills"
                placeholder="e.g. Java, Spring Boot, MySQL, REST APIs"
                value={formData.skills}
                onChange={handleChange}
                required
                className="create-job-input"
              />
              <small>
                Separate skills with commas.
              </small>
            </div>

            <div className="create-job-footer">
              <p>
                <span aria-hidden="true">✦</span>
                Review your details before publishing.
              </p>

              <div className="create-job-actions">
                <button
                  type="button"
                  className="create-job-cancel"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-job-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="create-job-spinner" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish Job <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>

        <p className="create-job-bottom-note">
          TalentFlow <span>·</span> Connecting great talent with great
          opportunities.
        </p>

      </div>
    </div>
  );
}

export default CreateJob;