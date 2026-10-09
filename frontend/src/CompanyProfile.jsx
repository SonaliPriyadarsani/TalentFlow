import { useEffect, useState } from "react";
import api from "./services/api";

function CompanyProfile({ onBack }) {
  const emptyProfile = {
    company_name: "",
    industry: "",
    company_size: "",
    location: "",
    website: "",
    company_email: "",
    company_phone: "",
    description: "",
  };

  const [profile, setProfile] = useState(emptyProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [logoUrl, setLogoUrl] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Controls the three states:
  // "empty"  = no company profile
  // "view"   = saved profile
  // "edit"   = add/update form
  const [profileMode, setProfileMode] = useState("empty");

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  // LOAD COMPANY PROFILE
  const loadCompanyProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/auth/company-profile",
        authConfig
      );

      const companyData = {
        company_name: response.data.company_name || "",
        industry: response.data.industry || "",
        company_size: response.data.company_size || "",
        location: response.data.location || "",
        website: response.data.website || "",
        company_email: response.data.company_email || "",
        company_phone: response.data.company_phone || "",
        description: response.data.description || "",
      };

      setProfile(companyData);

      await loadLogo();

      // Profile exists → show view mode
      setProfileMode("view");
    } catch (err) {
      if (err.response?.status === 404) {
        // No profile yet → show empty state
        setProfile(emptyProfile);
        setProfileMode("empty");
        setLogoUrl(null);
      } else {
        console.error(
          "Error loading company profile:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Unable to load company profile."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // LOAD COMPANY LOGO
  const loadLogo = async () => {
    try {
      const response = await api.get(
        "/auth/company-profile/logo",
        {
          ...authConfig,
          responseType: "blob",
        }
      );

      const objectUrl = URL.createObjectURL(response.data);

      setLogoUrl(objectUrl);
    } catch (err) {
      setLogoUrl(null);
    }
  };

  // INPUT CHANGE
  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // OPEN ADD FORM
  const handleAddProfile = () => {
    setMessage("");
    setError("");
    setSelectedLogo(null);
    setProfileMode("edit");
  };

  // OPEN UPDATE FORM
  const handleUpdateProfile = () => {
    setMessage("");
    setError("");
    setSelectedLogo(null);
    setProfileMode("edit");
  };

  // CANCEL EDIT
  const handleCancelEdit = () => {
    setMessage("");
    setError("");
    setSelectedLogo(null);

    // If company already exists, return to view
    if (profile.company_name) {
      setProfileMode("view");
    } else {
      // If it was a new profile, return to dashboard
      onBack();
    }
  };

  // SAVE COMPANY PROFILE
  const handleSave = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!profile.company_name.trim()) {
      setError("Company name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        "/auth/company-profile",
        {
          company_name: profile.company_name.trim(),
          industry: profile.industry.trim() || null,
          company_size: profile.company_size.trim() || null,
          location: profile.location.trim() || null,
          website: profile.website.trim() || null,
          company_email:
            profile.company_email.trim() || null,
          company_phone:
            profile.company_phone.trim() || null,
          description:
            profile.description.trim() || null,
        },
        authConfig
      );

      const updatedProfile = {
        company_name:
          response.data.company_name || "",
        industry:
          response.data.industry || "",
        company_size:
          response.data.company_size || "",
        location:
          response.data.location || "",
        website:
          response.data.website || "",
        company_email:
          response.data.company_email || "",
        company_phone:
          response.data.company_phone || "",
        description:
          response.data.description || "",
      };

      setProfile(updatedProfile);

      // Upload logo if a new one was selected
      if (selectedLogo) {
        await uploadLogo();
      }

      setMessage(
        "Company profile saved successfully."
      );

      // After saving → show profile
      setProfileMode("view");
    } catch (err) {
      console.error(
        "Error saving company profile:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to save company profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // LOGO SELECTION
  const handleLogoSelection = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG or WEBP image."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Company logo must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setError("");
    setSelectedLogo(file);

    const previewUrl = URL.createObjectURL(file);

    setLogoUrl(previewUrl);
  };

  // UPLOAD LOGO
  const uploadLogo = async () => {
    if (!selectedLogo) {
      return;
    }

    try {
      setUploadingLogo(true);

      const formData = new FormData();

      formData.append("file", selectedLogo);

      await api.post(
        "/auth/company-profile/logo",
        formData,
        authConfig
      );

      setSelectedLogo(null);

      await loadLogo();
    } catch (err) {
      console.error(
        "Error uploading company logo:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Profile saved, but logo upload failed."
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="jobs-container">
        <div className="loading-message">
          Loading company profile...
        </div>
      </div>
    );
  }

  // MAIN PAGE
  return (
    <div className="jobs-container company-profile-page">

      <div className="company-profile-topbar">

        <div>
          <h1>Company Profile</h1>

          <p className="section-subtitle">
            Manage your company information and profile.
          </p>
        </div>

        <button
          className="nav-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

      </div>

      {message && (
        <div className="company-profile-success">
          {message}
        </div>
      )}

      {error && (
        <div className="company-profile-error">
          {error}
        </div>
      )}


      {profileMode === "empty" && (
        <div className="company-profile-card company-profile-empty">

          <div className="company-empty-icon">
            🏢
          </div>

          <h2>Company Profile</h2>

          <p>
            You haven't added your company profile yet.
            Add your company information so candidates
            can learn more about your organization.
          </p>

          <button
            className="primary-button company-add-button"
            onClick={handleAddProfile}
          >
            + Add Company Profile
          </button>

        </div>
      )}


      {profileMode === "view" && (
        <div className="company-profile-card">

          <div className="company-view-header">

            <div className="company-view-logo">

              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="company-logo"
                />
              ) : (
                <div className="company-logo-placeholder">
                  🏢
                </div>
              )}

            </div>

            <div className="company-view-title">

              <h2>
                {profile.company_name}
              </h2>

              {profile.industry && (
                <p className="company-view-industry">
                  {profile.industry}
                </p>
              )}

            </div>

          </div>

          <div className="company-view-details">

            {profile.location && (
              <div className="company-view-item">
                <div>
                  <small>Location</small>
                  <strong>
                    {profile.location}
                  </strong>
                </div>
              </div>
            )}

            {profile.company_size && (
              <div className="company-view-item">
                <div>
                  <small>Company Size</small>
                  <strong>
                    {profile.company_size} employees
                  </strong>
                </div>
              </div>
            )}

            {profile.company_email && (
              <div className="company-view-item">
                <div>
                  <small>Email</small>
                  <strong>
                    {profile.company_email}
                  </strong>
                </div>
              </div>
            )}

            {profile.company_phone && (
              <div className="company-view-item">
             <div>
                  <small>Phone</small>
                  <strong>
                    {profile.company_phone}
                  </strong>
                </div>
              </div>
            )}

            {profile.website && (
              <div className="company-view-item">
                <div>
                  <small>Website</small>

                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {profile.website}
                  </a>
                </div>
              </div>
            )}

          </div>


          {profile.description && (
            <div className="company-view-description">

              <h3>About Company</h3>

              <p>
                {profile.description}
              </p>

            </div>
          )}
          <div className="company-view-actions">

            <button
              className="primary-button"
              onClick={handleUpdateProfile}
            >
               Update Profile
            </button>

          </div>

        </div>
      )}

      {profileMode === "edit" && (
        <div className="company-profile-card">

          <div className="company-profile-logo-section">

            <div className="company-logo-wrapper">

              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="company-logo"
                />
              ) : (
                <div className="company-logo-placeholder">
                  🏢
                </div>
              )}

            </div>

            <div className="company-logo-info">

              <h3>Company Logo</h3>

              <p>
                Upload a professional logo for your
                company.
              </p>

              <label className="company-logo-upload">
                Choose Logo

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleLogoSelection}
                />
              </label>

              <small>
                JPG, PNG or WEBP • Maximum 5 MB
              </small>

            </div>

          </div>

          <form
            className="profile-form"
            onSubmit={handleSave}
          >

            <div className="company-profile-grid">

              <div className="company-profile-field">

                <label>
                  Company Name *
                </label>

                <input
                  type="text"
                  name="company_name"
                  value={profile.company_name}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  required
                />

              </div>

              <div className="company-profile-field">

                <label>
                  Industry
                </label>

                <input
                  type="text"
                  name="industry"
                  value={profile.industry}
                  onChange={handleChange}
                  placeholder="e.g. Information Technology"
                />

              </div>

              <div className="company-profile-field">

                <label>
                  Company Size
                </label>

                <select
                  name="company_size"
                  value={profile.company_size}
                  onChange={handleChange}
                >

                  <option value="">
                    Select company size
                  </option>

                  <option value="1-10">
                    1-10 employees
                  </option>

                  <option value="11-50">
                    11-50 employees
                  </option>

                  <option value="51-200">
                    51-200 employees
                  </option>

                  <option value="201-500">
                    201-500 employees
                  </option>

                  <option value="501-1000">
                    501-1000 employees
                  </option>

                  <option value="1000+">
                    1000+ employees
                  </option>

                </select>

              </div>

              <div className="company-profile-field">

                <label>
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="e.g. Bengaluru, Karnataka"
                />

              </div>
              <div className="company-profile-field">

                <label>
                  Website
                </label>

                <input
                  type="url"
                  name="website"
                  value={profile.website}
                  onChange={handleChange}
                  placeholder="https://www.example.com"
                />

              </div>

              <div className="company-profile-field">

                <label>
                  Company Email
                </label>

                <input
                  type="email"
                  name="company_email"
                  value={profile.company_email}
                  onChange={handleChange}
                  placeholder="company@example.com"
                />

              </div>

              <div className="company-profile-field">

                <label>
                  Company Phone
                </label>

                <input
                  type="tel"
                  name="company_phone"
                  value={profile.company_phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                />

              </div>

            </div>

            <div className="company-profile-field company-description-field">

              <label>
                Company Description
              </label>

              <textarea
                name="description"
                value={profile.description}
                onChange={handleChange}
                placeholder="Tell candidates about your company..."
                rows="6"
              />

            </div>

            <div className="profile-form-buttons">

              <button
                type="submit"
                className="primary-button"
                disabled={
                  saving || uploadingLogo
                }
              >

                {saving
                  ? "Saving..."
                  : uploadingLogo
                  ? "Uploading Logo..."
                  : profile.company_name
                  ? "Save Changes"
                  : "Save Company Profile"}

              </button>

              <button
                type="button"
                className="nav-button"
                onClick={handleCancelEdit}
                disabled={
                  saving || uploadingLogo
                }
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

    </div>
  );
}

export default CompanyProfile;