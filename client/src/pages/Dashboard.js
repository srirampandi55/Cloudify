import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);

  // ✅ Load User Data from Local Storage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      alert("Session expired! Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const userObj = JSON.parse(storedUser);
      if (!userObj || !userObj._id) {
        throw new Error("Invalid user data");
      }
      setUser(userObj);
      fetchFiles(userObj._id);
    } catch (error) {
      console.error("User session error:", error);
      alert("Error loading user session. Please log in again.");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  // ✅ Fetch User Files
  const fetchFiles = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/files/user/${userId}`);
      setFiles(response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  // ✅ File Upload
  const onDrop = async (acceptedFiles) => {
    if (!user || !user._id) {
      alert("Session expired! Please log in again.");
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("file", acceptedFiles[0]);
    formData.append("userId", user._id);

    try {
      const response = await axios.post("http://localhost:5000/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFiles((prevFiles) => [...prevFiles, response.data.file]);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // ✅ File Delete
  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`http://localhost:5000/api/files/${fileId}`);
      setFiles(files.filter((file) => file._id !== fileId));
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <h2>Dashboard</h2>
      {user && <p>Welcome, {user.username}</p>}
      <button onClick={handleLogout} style={{ backgroundColor: "red", color: "white", padding: "10px", border: "none", cursor: "pointer" }}>
        Logout
      </button>

      <div {...getRootProps()} style={{ border: "2px dashed black", padding: "20px", marginTop: "20px", cursor: "pointer" }}>
        <input {...getInputProps()} />
        <p>Drag & drop a file here, or click to select a file</p>
      </div>

      <h3>Uploaded Files:</h3>
      {files.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((file) => (
            <li key={file._id} style={{ marginBottom: "10px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
              <a href={`http://localhost:5000${file.fileUrl}`} target="_blank" rel="noopener noreferrer">
                {file.filename}
              </a>
              <button onClick={() => handleDelete(file._id)} style={{ marginLeft: "10px", color: "red", border: "none", background: "none", cursor: "pointer" }}>
                ❌ Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
