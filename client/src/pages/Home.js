import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div style={styles.container}>
      <h1>Welcome to Cloud Storage App</h1>
      <p>Securely upload, store, and manage your files online.</p>

      <div style={styles.buttonContainer}>
        <Link to="/login">
          <button style={styles.button}>Login</button>
        </Link>
        <Link to="/register">
          <button style={{ ...styles.button, backgroundColor: "#28a745" }}>Register</button>
        </Link>
      </div>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
  },
  buttonContainer: {
    marginTop: "20px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    margin: "10px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "white",
    borderRadius: "5px",
  },
};

export default Home;
