import React, { useState, useEffect, useRef } from "react";
import "../styles/AdminProfile.css";
import { FaCog, FaEye, FaEyeSlash, FaUserCircle } from "react-icons/fa";
import axios from "axios";

const Section = ({ icon, title, children }) => (
  <section className="section card">
    <h3 className="section-title">
      {icon} {title}
    </h3>
    <div className="section-content">{children}</div>
  </section>
);

const PasswordInput = ({ label, value, onChange, showPassword, toggleShowPassword, error }) => (
  <div className={`password-input-container ${error ? "error" : ""}`}>
    <label className="input-label">{label}</label>
    <input
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={label}
      className="edit-input"
      aria-invalid={error ? "true" : "false"}
    />
    <button
      type="button"
      onClick={toggleShowPassword}
      className="toggle-password"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <FaEyeSlash /> : <FaEye />}
    </button>
    {error && <span className="error-message">{error}</span>}
  </div>
);

const AdminProfile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [tempPic, setTempPic] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // New state for file
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    nom: "",
    prenom: "",
    email: "",
    phone: "",
    address: "",
    ville: "",
    cin: "",
  });
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmNewPassword: false,
  });
  const [errors, setErrors] = useState({});
  const passwordFormRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = () => {
      setIsLoading(true);
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const { nom, prenom, email, phone, address, ville, cin, photo } = JSON.parse(userData);
          setProfile({ nom, prenom, email, phone, address, ville, cin });
          setProfilePic(photo || null);
        } else {
          console.error("No user data found in localStorage");
          alert("No profile data available. Please log in again.");
        }
      } catch (err) {
        console.error("Error parsing profile data:", err);
        alert("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    const handleClickOutside = (event) => {
      if (passwordFormRef.current && !passwordFormRef.current.contains(event.target)) {
        setIsChangingPassword(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file?.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setTempPic({ file, preview });
  };

  const handleProfileChange = (field) => (e) =>
    setProfile({ ...profile, [field]: e.target.value });

  const handlePasswordChange = (field) => (e) =>
    setPasswords({ ...passwords, [field]: e.target.value });

  const toggleShowPassword = (field) => () =>
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });

  const validateProfile = () => {
    const newErrors = {};
    if (!profile.nom) newErrors.nom = "Nom is required";
    if (!profile.prenom) newErrors.prenom = "Prénom is required";
    if (!profile.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(profile.email)) newErrors.email = "Invalid email format";
    if (!profile.cin) newErrors.cin = "CIN is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setIsLoading(true);

    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = userData._id;
      const token = localStorage.getItem("token");

      if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        alert("Invalid user ID. Please log in again.");
        return;
      }

      const formData = new FormData();
      formData.append("nom", profile.nom);
      formData.append("prenom", profile.prenom);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("address", profile.address);
      formData.append("ville", profile.ville);
      formData.append("cin", profile.cin);
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      const response = await axios.put(
        `http://localhost:5000/apiLogin/edit/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update localStorage with new profile data
      localStorage.setItem("user", JSON.stringify({ ...userData, ...response.data.user }));

      // Update state with new photo
      setProfilePic(response.data.user.photo || profilePic);
      setTempPic(null);
      setSelectedFile(null);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validatePasswords = () => {
    const newErrors = {};
    if (!passwords.newPassword) newErrors.newPassword = "New password is required";
    else if (passwords.newPassword.length < 6)
      newErrors.newPassword = "Password must be at least 6 characters";
    if (passwords.newPassword !== passwords.confirmNewPassword)
      newErrors.confirmNewPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;
    setIsLoading(true);

    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = userData._id;
      const token = localStorage.getItem("token");

      if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        alert("Invalid user ID. Please log in again.");
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/apiLogin/${userId}/password`,
        {
          newPassword: passwords.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);
      setPasswords({ newPassword: "", confirmNewPassword: "" });
      setIsChangingPassword(false);
      setErrors({});
    } catch (err) {
      console.error("Password change error:", err);
      alert(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-profile">
      <div className="profile-header card">
        <div className="profile-pic-container">
          <label htmlFor="profilePicInput" className="profile-pic-label">
            {tempPic?.preview || profilePic ? (
              <img
                src={tempPic?.preview || profilePic}
                alt="Profile"
                className="profile-pic"
              />
            ) : (
              <div className="profile-pic-placeholder">
                <FaUserCircle className="placeholder-icon" />
              </div>
            )}
          </label>
          {isEditing && (
            <input
              type="file"
              id="profilePicInput"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              ref={fileInputRef}
            />
          )}
        </div>
        <div className="user-details">
          {isEditing ? (
            <div className="profile-form">
              <div className={`input-group ${errors.nom ? "error" : ""}`}>
                <label className="input-label">Nom *</label>
                <input
                  type="text"
                  value={profile.nom}
                  onChange={handleProfileChange("nom")}
                  placeholder="Nom"
                  className="edit-input"
                  aria-invalid={errors.nom ? "true" : "false"}
                />
                {errors.nom && <span className="error-message">{errors.nom}</span>}
              </div>
              <div className={`input-group ${errors.prenom ? "error" : ""}`}>
                <label className="input-label">Prénom *</label>
                <input
                  type="text"
                  value={profile.prenom}
                  onChange={handleProfileChange("prenom")}
                  placeholder="Prénom"
                  className="edit-input"
                  aria-invalid={errors.prenom ? "true" : "false"}
                />
                {errors.prenom && <span className="error-message">{errors.prenom}</span>}
              </div>
              <div className={`input-group ${errors.email ? "error" : ""}`}>
                <label className="input-label">Email *</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={handleProfileChange("email")}
                  placeholder="Email"
                  className="edit-input"
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              <div className={`input-group ${errors.cin ? "error" : ""}`}>
                <label className="input-label">CIN *</label>
                <input
                  type="text"
                  value={profile.cin}
                  onChange={handleProfileChange("cin")}
                  placeholder="CIN"
                  className="edit-input"
                  aria-invalid={errors.cin ? "true" : "false"}
                />
                {errors.cin && <span className="error-message">{errors.cin}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={handleProfileChange("phone")}
                  placeholder="Phone"
                  className="edit-input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={handleProfileChange("address")}
                  placeholder="Address"
                  className="edit-input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Ville</label>
                <input
                  type="text"
                  value={profile.ville}
                  onChange={handleProfileChange("ville")}
                  placeholder="Ville"
                  className="edit-input"
                />
              </div>
            </div>
          ) : (
            <>
              <h2>
                {profile.prenom} {profile.nom}
              </h2>
              <p className="user-info">{profile.email}</p>
              {profile.cin && <p className="user-info">CIN: {profile.cin}</p>}
              {profile.phone && <p className="user-info">Phone: {profile.phone}</p>}
              {profile.address && <p className="user-info">Address: {profile.address}</p>}
              {profile.ville && <p className="user-info">Ville: {profile.ville}</p>}
            </>
          )}
        </div>
      </div>

      <Section icon={<FaCog />} title="Profile Settings">
        <button
          onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
          className="btn primary"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
        </button>
      </Section>

      <Section icon={<FaCog />} title="Security">
        {isChangingPassword ? (
          <div ref={passwordFormRef} className="password-form">
            <PasswordInput
              label="New Password"
              value={passwords.newPassword}
              onChange={handlePasswordChange("newPassword")}
              showPassword={showPasswords.newPassword}
              toggleShowPassword={toggleShowPassword("newPassword")}
              error={errors.newPassword}
            />
            <PasswordInput
              label="Confirm New Password"
              value={passwords.confirmNewPassword}
              onChange={handlePasswordChange("confirmNewPassword")}
              showPassword={showPasswords.confirmNewPassword}
              toggleShowPassword={toggleShowPassword("confirmNewPassword")}
              error={errors.confirmNewPassword}
            />
            <button
              onClick={handleChangePassword}
              className="btn primary"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save New Password"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="btn primary"
            disabled={isLoading}
          >
            Change Password
          </button>
        )}
      </Section>
    </div>
  );
};

export default AdminProfile;