import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateStudyContent } from "./bedrock.js";
import { saveNotes } from "./s3.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check (useful for load balancer)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "studypilot" });
});

app.post("/api/study", async (req, res) => {
  try {
    const notes = (req.body.notes || "").trim();
    const goal = req.body.goal || "Revise today";

    if (notes.length < 50) {
      return res.status(400).json({
        error: "Please provide at least 50 characters of notes.",
      });
    }

    if (notes.length > 5000) {
      return res.status(400).json({
        error: "Notes must be under 5,000 characters.",
      });
    }

    // Store notes privately in S3 (non-blocking for the response if it fails)
    let s3Key = null;
    try {
      s3Key = await saveNotes(notes);
    } catch (s3Err) {
      console.error("S3 save failed:", s3Err.message);
      // Continue — generation is more important than storage
    }

    const response = await generateStudyContent(notes, goal);

    res.json({
      response,
      storedAt: s3Key,
      goal,
    });
  } catch (error) {
    console.error("StudyPilot error:", error);
    res.status(500).json({
      error: "StudyPilot could not process the notes. Please try again.",
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`StudyPilot backend running on port ${PORT}`);
});
