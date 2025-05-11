import React, { useState, useEffect, useRef } from "react";
import "../styles/AdminProfile.css";
import { FaCog, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";

const Section = ({ icon, title, children }) => (
  <section className="section">
    <h3>
      {icon} {title}
    </h3>
    <div className="section-content">{children}</div>
  </section>
);

const PasswordInput = ({ label, value, onChange, showPassword, toggleShowPassword }) => (
  <div className="password-input-container">
    <input
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={label}
      className="edit-input"
    />
    <button type="button" onClick={toggleShowPassword} className="toggle-password">
      {showPassword ? <FaEyeSlash /> : <FaEye />}
    </button>
  </div>
);

const AdminProfile = () => {
  const [profilePic, setProfilePic] = useState("https://via.placeholder.com/150");
  const [tempPic, setTempPic] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profile, setProfile] = useState({
    name: "Takwa Teka",
    email: "tekatakwa@gmail.com",
  });
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });

  const passwordFormRef = useRef(null);

  useEffect(() => {
    const storedProfilePic = localStorage.getItem("profilePic") || "https://via.placeholder.com/150";
    setProfilePic(storedProfilePic);

    const handleClickOutside = (event) => {
      if (passwordFormRef.current && !passwordFormRef.current.contains(event.target)) {
        setIsChangingPassword(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file?.type.startsWith("image/")) {
      setTempPic(URL.createObjectURL(file));
    } else {
      alert("Please select a valid image.");
    }
  };

  const handleProfilePicUpdate = () => {
    if (tempPic) {
      setProfilePic(tempPic);
      localStorage.setItem("profilePic", tempPic);
      setTempPic(null);
    }
  };

  const handleProfileChange = (field) => (e) =>
    setProfile({ ...profile, [field]: e.target.value });

  const handlePasswordChange = (field) => (e) =>
    setPasswords({ ...passwords, [field]: e.target.value });

  const toggleShowPassword = (field) => () =>
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });

  const handleSaveProfile = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/users/edit/${userId}`,
        { ...profile, role: "admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update profile.");
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `http://localhost:5000/api/users/change-password/${userId}`,
        {
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message);
      setPasswords({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
      setIsChangingPassword(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to change password.");
    }
  };

  return (
    <div className="admin-profile">
      <div className="profile-info">
        <label htmlFor="profilePicInput">
          <img src={tempPic || profilePic} alt="Profile" className="profile-pic" />
        </label>
        <input
          type="file"
          id="profilePicInput"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <div className="user-details">
          {isEditing ? (
            <>
              <input
                type="text"
                value={profile.name}
                onChange={handleProfileChange("name")}
                placeholder="Name"
                className="edit-input"
              />
              <input
                type="email"
                value={profile.email}
                onChange={handleProfileChange("email")}
                placeholder="Email"
                className="edit-input"
              />
            </>
          ) : (
            <>
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
            </>
          )}
        </div>
      </div>

      <Section icon={<FaCog />} title="Profile Settings">
        <button
          onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
          className="btn"
        >
          {isEditing ? "Save Changes" : "Edit Profile"}
        </button>
        <button
          onClick={handleProfilePicUpdate}
          className="btn"
          disabled={!tempPic}
        >
          Update Profile Picture
        </button>
      </Section>

      <Section icon={<FaCog />} title="Security">
        {isChangingPassword ? (
          <div ref={passwordFormRef} className="password-form">
            <PasswordInput
              label="Old Password"
              value={passwords.oldPassword}
              onChange={handlePasswordChange("oldPassword")}
              showPassword={showPasswords.oldPassword}
              toggleShowPassword={toggleShowPassword("oldPassword")}
            />
            <PasswordInput
              label="New Password"
              value={passwords.newPassword}
              onChange={handlePasswordChange("newPassword")}
              showPassword={showPasswords.newPassword}
              toggleShowPassword={toggleShowPassword("newPassword")}
            />
            <PasswordInput
              label="Confirm New Password"
              value={passwords.confirmNewPassword}
              onChange={handlePasswordChange("confirmNewPassword")}
              showPassword={showPasswords.confirmNewPassword}
              toggleShowPassword={toggleShowPassword("confirmNewPassword")}
            />
            <button onClick={handleChangePassword} className="btn">
              Save New Password
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="btn"
          >
            Change Password
          </button>
        )}
      </Section>
    </div>
  );
};

export default AdminProfile;