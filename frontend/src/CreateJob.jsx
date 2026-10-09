import { useState } from "react";
import api from "./services/api";
import "./RecruiterDashboard.css";

function CreateJob({ onJobCreated, onCancel }) {
  const [formData, setFormData] = useState({
  title: "",
  description: "",
  location: "",
  experience: "",
  skills: "",
  company: "",
  closing_date: "",
  job_type: "Full-time",
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");

    try {
      const response = await api.post(
        "/jobs/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Job created:", response.data);

      setSuccess("Job created successfully!");

      setFormData({
  title: "",
  description: "",
  location: "",
  experience: "",
  skills: "",
  company: "",
  closing_date: "",
  job_type: "Full-time",
});

      if (onJobCreated) {
        onJobCreated(response.data);
      }

    } catch (error) {
      console.error("Error creating job:", error);

      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError("Failed to create job.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recruiter-dashboard create-job-page">

  <div className="create-job-card">

        <h2>Create New Job</h2>

        {success && (
          <p className="success-message">
            {success}
          </p>
        )}

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

<form onSubmit={handleSubmit} className="create-job-form">
          <input
            type="text"
            name="title"
            placeholder="Job Title"
            value={formData.title}
            onChange={handleChange}
              className="create-job-input"
            required
          />

          <textarea
            name="description"
            placeholder="Job Description"
            value={formData.description}
            onChange={handleChange}
              className="create-job-textarea"
            required
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
              className="create-job-input"
            required
          />

          <input
            type="text"
            name="experience"
            placeholder="Experience (e.g. 0-2 years)"
            value={formData.experience}
            onChange={handleChange}
              className="create-job-input"
            required
          />

          <input
            type="text"
            name="skills"
            placeholder="Skills (e.g. Java, Spring Boot, MySQL)"
            value={formData.skills}
            onChange={handleChange}
              className="create-job-input"
            required
          />

          <input
            type="text"
            name="company"
            placeholder="Company Name"
            value={formData.company}
            onChange={handleChange}
              className="create-job-input"
            required
          />
<div className="create-job-field">
<label className="create-job-label">
      Job Type
  </label>

  <select
    name="job_type"
    value={formData.job_type}
    onChange={handleChange}
className="create-job-select"
    required
  >
    <option value="Full-time">Full-time</option>
    <option value="Internship">Internship</option>
    <option value="Part-time">Part-time</option>
  </select>
</div>

<div className="create-job-field">
<label className="create-job-label">
      Application Deadline
  </label>

  <input
    type="date"
    name="closing_date"
    value={formData.closing_date}
    onChange={handleChange}
    min={new Date().toISOString().split("T")[0]}
className="create-job-input"
    required
  />

<small className="create-job-help">
      Select a date from today onward.
  </small>
</div>

          <button
            type="submit"
            disabled={loading}
              className="create-job-submit"

          >
            {loading ? "Creating..." : "Create Job"}
          </button>

          <button
            type="button"
  className="create-job-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>

        </form>

      </div>

    </div>
  );
}

export default CreateJob;