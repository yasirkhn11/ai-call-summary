// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.get("/health", (req, res) => {
//   res.json({ status: "ok" });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


import express from "express";
import cors from "cors";
import supabase from "./config/supabase.js";
import authRoutes from "./routes/auth.js";
import callRoutes from "./routes/call.js"
import transcribeRoutes from "./routes/transcribe.js";
import summariesRoutes from "./routes/summaries.js";
import dotenv from "dotenv";

dotenv.config();



const app = express();
app.use(cors());
app.use(express.json());


// Test route
app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*").limit(1);
  if (error) return res.status(500).json(error);
  res.json(data);
});

app.use("/auth", authRoutes);
app.use("/call" , callRoutes);
app.use("/transcribe", transcribeRoutes);
app.use("/summarize", summariesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
