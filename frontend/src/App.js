import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a resume");
      return;
    }

    if (!role.trim()) {
      alert("Please enter a job role");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("role", role);

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        "https://ai-resume-analyzer-mjgh.onrender.com/analyze",
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
      );

      // ✅ SAFE JSON PARSING (FINAL FIX)
      try {
        const parsed = JSON.parse(res.data.result);
        setResult(parsed);
      } catch (e) {
        console.log("RAW RESPONSE:", res.data.result);
        setResult({ error: "Invalid JSON response from AI" });
      }

    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">✨ AI Resume Job Matcher</h1>

        {/* Job Role Input */}
        <input
          type="text"
          placeholder="Enter Job Role (e.g. Data Scientist)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input"
        />

        {/* File Upload */}
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <br /><br />

        <button onClick={handleUpload}>
          Analyze Resume
        </button>

        {loading && <p>Analyzing... ⏳</p>}

        {/* ✅ RESULT DISPLAY */}
        {result && !result.error && (
          <div className="result">
            <div className="score">
              🎯 Match: {result.match_percentage}%
            </div>

            <div className="score">
              📊 Score: {result.score}/100
            </div>

            <div className="section">
              <h3>✅ Matched Keywords</h3>
              <ul>
                {result.matched_keywords?.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>

            <div className="section">
              <h3>❌ Missing Keywords</h3>
              <ul>
                {result.missing_keywords?.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>

            <div className="section">
              <h3>🧠 Summary</h3>
              <p>{result.summary}</p>
            </div>
          </div>
        )}

        {/* ❌ ERROR DISPLAY */}
        {result && result.error && (
          <p style={{ color: "red" }}>{result.error}</p>
        )}
      </div>
    </div>
  );
}

export default App;