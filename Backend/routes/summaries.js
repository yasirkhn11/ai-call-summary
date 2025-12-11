import express from "express";
import supabase from "../config/supabase.js";
import openai from "../config/openai.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:uploadId", authenticateToken, async (req, res) => {
  try {
    const uploadId = req.params.uploadId;

    // 1️⃣ Get transcript
    const { data: file, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .single();

    if (error || !file || !file.transcript) {
      return res.status(404).json({ message: "Transcript not found" });
    }

    // 2️⃣ Generate summary using OpenAI
    const prompt = `
      Summarize the following call transcript in 100-150 words.
      Then extract:
      - Key decisions
      - Action items with deadlines
      - Follow-up email in professional tone

      Transcript:
      ${file.transcript}
    `;

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const summaryText = gptResponse.choices[0].message.content;

    // 3️⃣ Save in summaries table
    const { data: savedSummary, error: saveError } = await supabase
      .from("summaries")
      .insert([
        {
          upload_id: uploadId,
          summary: summaryText,
        },
      ])
      .select();

    if (saveError) return res.status(500).json(saveError);

    res.json({
      message: "Summary generated successfully",
      summary: savedSummary[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate summary", error: err.message });
  }
});

export default router;
