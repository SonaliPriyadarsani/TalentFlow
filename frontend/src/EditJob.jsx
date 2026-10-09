import { useState } from "react";
import api from "./services/api";

function EditJob({ job, onJobUpdated, onCancel }) {
  const [formData, setFormData] = useState({
  title: job.title || "",
  description: job.description || "",
  location: job.location || "",
  experience: job.experience || "",
  skills: job.skills || "",
  company: job.company || "",
  closing_date: job.closing_date
    ? job.closing_date.substring(0, 10)
    : "",
  job_type: job.job_type || "Full-time",
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle input changes
  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  // Update job
  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");

    try {
      const response = await api.put(
        `/jobs/${job.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Job updated:", response.data);

      setSuccess("Job updated successfully!");

      // Send updated job back to dashboard
      if (onJobUpdated) {
        onJobUpdated(response.data);
      }

    } catch (error) {
      console.error("Error updating job:", error);

      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError("Failed to update job.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recruiter-dashboard edit-job-page">
  <div className="edit-job-card">

<div>
    <h2>Edit Job</h2>
    <p>Update your job posting details and keep the opportunity current.</p>
  </div>
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

<form onSubmit={handleSubmit} className="edit-job-form">
          <input
            type="text"
            name="title"
            placeholder="Job Title"
            value={formData.title}
            onChange={handleChange}
            className="edit-job-input"
            required
          />

          <textarea
            name="description"
            placeholder="Job Description"
            value={formData.description}
            onChange={handleChange}
            className="edit-job-textarea"
rows="6"
            required
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            className="edit-job-input"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="experience"
            placeholder="Experience (e.g. 0-2 years)"
            value={formData.experience}
            onChange={handleChange}
            className="edit-job-input"
            required
          />

          <input
            type="text"
            name="skills"
            placeholder="Skills (e.g. Java, Spring Boot, MySQL)"
            value={formData.skills}
            onChange={handleChange}
            className="edit-job-input"
            required
          />

          <input
            type="text"
            name="company"
            placeholder="Company Name"
            value={formData.company}
            onChange={handleChange}
            className="edit-job-input"
            required
          />

<div className="edit-job-field"> 
<label className="edit-job-label">
      Job Type
  </label>

  <select
    name="job_type"
    value={formData.job_type}
    onChange={handleChange}
className="edit-job-select"
    required
  >
    <option value="Full-time">Full-time</option>
    <option value="Internship">Internship</option>
    <option value="Part-time">Part-time</option>
  </select>
</div>
<div className="edit-job-field">
<label className="edit-job-label">
    Application Deadline
</label>

<input
  type="date"
  name="closing_date"
  value={formData.closing_date}
  onChange={handleChange}
  className="edit-job-input"
  required
/>
</div>

          <button
            type="submit"
            disabled={loading}
              className="edit-job-submit"
          >
            {loading ? "Updating..." : "Update Job"}
          </button>

          <button
            type="button"
              className="edit-job-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>

        </form>

      </div>

    </div>
  );
}

export default EditJob;