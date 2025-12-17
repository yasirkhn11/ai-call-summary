// // import express from "express";
// // import multer from "multer";
// // import {authenticateToken }from "../middleware/authMiddleware.js";
// // import path from "path";
// // import fs from "fs";

// // const router = express.Router();

// // // Set up storage (local folder "uploads")
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     const uploadDir = "./uploads";
// //     if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
// //     cb(null, uploadDir);
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueName = Date.now() + "-" + file.originalname;
// //     cb(null, uniqueName);
// //   },
// // });

// // const upload = multer({ storage });

// // // ------------------- Upload Call -------------------
// // router.post("/upload", authenticateToken, upload.single("file"), async (req, res) => {
// //   if (!req.file) return res.status(400).json({ message: "No file uploaded" });

// //   // File info
// //   const fileInfo = {
// //     user_id: req.user.id,
// //     filename: req.file.filename,
// //     path: req.file.path,
// //     mimetype: req.file.mimetype,
// //     size: req.file.size,
// //     uploaded_at: new Date(),
// //   };

// //   // Here you can save fileInfo to DB if needed
// //   // Example: supabase.from("uploads").insert([fileInfo])

// //   res.json({ message: "File uploaded successfully", file: fileInfo });
// // });

// // export default router;


// import express from "express";
// import multer from "multer";
// import { authenticateToken } from "../middleware/authMiddleware.js";
// import supabase from "../config/supabase.js";
// import fs from "fs";

// const router = express.Router();

// // Storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = "./uploads";
//     if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + "-" + file.originalname;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage });

// // ✅ Upload API
// router.post(
//   "/upload",
//   authenticateToken,
//   upload.single("file"),
//   async (req, res) => {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     const fileInfo = {
//       user_id: req.user.id,
//       filename: req.file.filename,
//       path: req.file.path,
//       mimetype: req.file.mimetype,
//       size: req.file.size,
//     };

//     // ✅ SAVE TO SUPABASE (MOST IMPORTANT PART)
//     const { data, error } = await supabase
//       .from("uploads")
//       .insert([fileInfo])
//       .select()
//       .single();

//     if (error) {
//       return res.status(500).json(error);
//     }

//     res.json({
//       message: "File uploaded successfully",
//       upload_id: data.id,
//       file: data,
//     });
//   }
// );

// export default router;

///////////////////                 Local Storage                 /////////////////
// import express from "express";
// import multer from "multer";
// import { authenticateToken } from "../middleware/authMiddleware.js";
// import supabase from "../config/supabase.js";

// import fs from "fs";

// const router = express.Router();

// // Set up storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = "./uploads";
//     if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + "-" + file.originalname;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage });

// // Upload endpoint
// router.post("/upload", authenticateToken, upload.single("file"), async (req, res) => {
//   if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//   const fileInfo = {
//     user_id: req.user.id,
//     filename: req.file.filename,
//     path: req.file.path,
//     mimetype: req.file.mimetype,
//     size: req.file.size,
//     uploaded_at: new Date(),
//   };

//   // Save file info to Supabase uploads table
//   const { data, error } = await supabase.from("uploads").insert([fileInfo]).select();

//   if (error) return res.status(500).json(error);

//   res.json({ message: "File uploaded successfully", file: data[0] });
// });

// export default router;


/////////////////              S3 Storage                             /////////////

import express from "express";
import multer from "multer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";
import supabase from "../config/supabase.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer memory storage for S3
const upload = multer({ storage: multer.memoryStorage() });

// ---------------- Upload Audio to S3 ----------------
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileName = `${Date.now()}-${req.file.originalname}`;
      const s3Path = `audio/${fileName}`;

      // Upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Path,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;

      // Save metadata to Supabase
      const { data, error } = await supabase
        .from("uploads")
        .insert([
          {
            user_id: req.user.id,
            file_url: fileUrl,
            filename: req.file.originalname,
            path: s3Path,
            mimetype: req.file.mimetype,
            size: req.file.size,
            status: "uploaded",
            uploaded_at: new Date(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: "Audio uploaded to S3 successfully",
        upload: data,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({
        message: "Upload failed",
        error: err.message,
      });
    }
  }
);

export default router;

