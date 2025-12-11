// // import express from "express";
// // import fs from "fs";
// // import supabase from "../config/supabase.js";
// // import openai from "../config/openai.js";
// // import { authenticateToken } from "../middleware/authMiddleware.js";

// // const router = express.Router();

// // router.post("/:uploadId", authenticateToken, async (req, res) => {
// //   try {
// //     const { uploadId } = req.params;

// //     const { data: upload, error } = await supabase
// //       .from("uploads")
// //       .select("*")
// //       .eq("id", uploadId)
// //       .single();

// //     if (error || !upload) return res.status(404).json({ message: "Upload not found" });

// //     const audioStream = fs.createReadStream(upload.path);

// //     const transcription = await openai.audio.transcriptions.create({
// //       file: audioStream,
// //       model: "gpt-4o-transcribe",
// //     });

// //     const { data: transcript } = await supabase
// //       .from("transcripts")
// //       .insert([
// //         {
// //           upload_id: upload.id,
// //           user_id: upload.user_id,
// //           text: transcription.text,
// //         },
// //       ])
// //       .select()
// //       .single();

// //     res.json({
// //       message: "Transcription successful",
// //       transcript_id: transcript.id,
// //       text: transcript.text,
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: "Transcription failed" });
// //   }
// // });

// // export default router;


// import express from "express";
// import fs from "fs";
// import supabase from "../config/supabase.js";
// import { authenticateToken } from "../middleware/authMiddleware.js";
// import openai from "../config/openai.js"; // your OpenAI client

// const router = express.Router();

// router.post("/:uploadId", authenticateToken, async (req, res) => {
//   try {
//     const uploadId = req.params.uploadId;

//     // 1️⃣ Get the uploaded file from DB
//     const { data: file, error } = await supabase
//       .from("uploads")
//       .select("*")
//       .eq("id", uploadId)
//       .single();

//     if (error || !file) return res.status(404).json({ message: "File not found" });

//     // 2️⃣ Read the file
//     const fileStream = fs.createReadStream(file.path);

//     // 3️⃣ Send to OpenAI Whisper
//     const transcription = await openai.audio.transcriptions.create({
//       file: fileStream,
//       model: "gpt-4o-transcribe",
//     });

//     // 4️⃣ Save transcript back to Supabase
//     const { data: updated, error: updateError } = await supabase
//       .from("uploads")
//       .update({ status: "transcribed", transcript: transcription.text })
//       .eq("id", uploadId)
//       .select();

//     if (updateError) return res.status(500).json(updateError);

//     res.json({
//       message: "Transcription successful",
//       transcript: transcription.text,
//       file: updated[0],
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Transcription failed", error: err.message });
//   }
// });

// export default router;


import express from "express";
import fs from "fs";
import openai from "../config/openai.js";
import supabase from "../config/supabase.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:uploadId", authenticateToken, async (req, res) => {
  try {
    const uploadId = req.params.uploadId;

    // 1️⃣ Get upload record
    const { data: file, error: fileError } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ message: "Upload not found" });
    }

    // 2️⃣ Read audio file
    const fileStream = fs.createReadStream(file.path);

    // 3️⃣ Transcribe using OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "gpt-4o-transcribe",
    });

    // 4️⃣ Update uploads table (optional)
    await supabase
      .from("uploads")
      .update({ status: "transcribed" })
      .eq("id", uploadId);

    // 5️⃣ Insert into transcripts table
    const { data: transcriptData, error: transcriptError } = await supabase
      .from("transcripts")
      .insert([
        { upload_id: uploadId, text: transcription.text },
      ])
      .select();

    if (transcriptError) {
      return res.status(500).json({ message: "Failed to save transcript", error: transcriptError });
    }

    res.json({
      message: "Transcription successful",
      transcript: transcription.text,
      transcript_record: transcriptData[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Transcription failed", error: err.message });
  }
});

export default router;
