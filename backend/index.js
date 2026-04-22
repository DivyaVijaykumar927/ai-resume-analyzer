
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
console.log("API KEY LOADED:", process.env.GROQ_API_KEY ? "YES" : "NO");

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdf = require("pdf-parse");

const Groq = require("groq-sdk");

const app = express();
app.use(cors({
  origin: "*"
}));
app.use(express.json());

// File upload config
const upload = multer({ dest: "uploads/" });

// ✅ Use API key from .env
const groq = new Groq({ apiKey: "", });

app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    console.log("API HIT");

    // ✅ Get job role
    const role = req.body.role;
    console.log("ROLE:", role);

    // ✅ Validate inputs
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!role) {
      return res.status(400).json({ error: "Job role missing" });
    }

    console.log("FILE:", req.file);

    // ✅ Extract PDF text
    let resumeText = "";

    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdf(dataBuffer);
      resumeText = data.text;

      console.log("PDF TEXT LENGTH:", resumeText.length);
    } catch (err) {
      console.error("PDF ERROR:", err);
      return res.status(500).json({ error: "PDF parsing failed" });
    }

    // ✅ Call Groq
    let result = "";

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `
You are an AI Resume Job Matcher.

Job Role:
${role}

Resume:
${resumeText}

Return STRICT JSON:

{
  "match_percentage": number (0-100),
  "score": number (0-100),
  "matched_keywords": [],
  "missing_keywords": [],
  "summary": ""
}

Rules:
- Extract skills from resume
- Compare with job role
- Calculate realistic percentage
- Be concise
- Return ONLY JSON (no explanation)
            `,
          },
        ],
      });

      console.log("GROQ RESPONSE RECEIVED");


      let raw = response.choices[0].message.content;

// Remove markdown if present
raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

// Extract only JSON
const jsonStart = raw.indexOf("{");
const jsonEnd = raw.lastIndexOf("}") + 1;

const cleanJson = raw.substring(jsonStart, jsonEnd);

result = cleanJson;

      

    } catch (err) {
      console.error("GROQ ERROR:", err);
      return res.status(500).json({ error: "Groq failed" });
    }

    // ✅ Send result to frontend
    res.json({ result });

  } catch (error) {
    console.error("FINAL ERROR:", error);
    res.status(500).json({ error: "Error analyzing resume" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));