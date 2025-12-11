// import express from "express";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import supabase from "../config/supabase.js";

// const router = express.Router();
// const JWT_SECRET = "your_jwt_secret_key"; // replace with .env variable later

// // Register
// router.post("/register", async (req, res) => {
//   const { name, email, password } = req.body;

//   // Hash password
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Insert user in Supabase
//   const { data, error } = await supabase
//     .from("users")
//     .insert([{ name, email, password: hashedPassword }])
//     .select();

//   if (error) return res.status(400).json(error);

//   res.json({ message: "User registered successfully", user: data[0] });
// });

// // Login
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   const { data, error } = await supabase
//     .from("users")
//     .select("*")
//     .eq("email", email)
//     .single();

//   if (error || !data) return res.status(400).json({ message: "Invalid email or password" });

//   // Compare password
//   const match = await bcrypt.compare(password, data.password);
//   if (!match) return res.status(400).json({ message: "Invalid email or password" });

//   // Generate JWT
//   const token = jwt.sign({ id: data.id, email: data.email }, JWT_SECRET, { expiresIn: "7d" });

//   res.json({ message: "Login successful", token });
// });

// export default router;


import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // Replace with process.env.JWT_SECRET later

// -------------------- REGISTER --------------------
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user in Supabase
  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, password: hashedPassword }])
    .select();

  if (error) return res.status(400).json(error);

  res.json({ message: "User registered successfully", user: data[0] });
});

// -------------------- LOGIN --------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data)
    return res.status(400).json({ message: "Invalid email or password" });

  const match = await bcrypt.compare(password, data.password);
  if (!match) return res.status(400).json({ message: "Invalid email or password" });

  const token = jwt.sign({ id: data.id, email: data.email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ message: "Login successful", token });
});

// -------------------- LOGOUT --------------------
router.post("/logout", authenticateToken, (req, res) => {
  // JWT logout is client-side, just respond
  res.json({ message: "Logout successful. Please delete token on client." });
});

// -------------------- GET ALL USERS --------------------
router.get("/users", authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) return res.status(500).json(error);

  // Remove passwords from response
  const users = data.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    created_at: u.created_at,
  }));
  res.json(users);
});

// -------------------- GET USER BY ID --------------------
router.get("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single();

  if (error || !data) return res.status(404).json({ message: "User not found" });

  const user = { id: data.id, name: data.name, email: data.email, created_at: data.created_at };
  res.json(user);
});

// ------------------- Update User -------------------
router.put("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  // Only allow users to update their own account
  if (parseInt(id) !== req.user.id) {
    return res.status(403).json({ message: "You can only update your own account" });
  }

  // Prepare updated fields
  let updatedFields = {};
  if (name) updatedFields.name = name;
  if (email) updatedFields.email = email;
  if (password) updatedFields.password = await bcrypt.hash(password, 10);

  // Update in Supabase
  const { data, error } = await supabase
    .from("users")
    .update(updatedFields)
    .eq("id", id)
    .select();

  if (error) return res.status(400).json(error);

  const updatedUser = data[0];
  delete updatedUser.password; // remove password from response
  res.json({ message: "User updated successfully", user: updatedUser });
});

// ------------------- Delete User -------------------
router.delete("/users/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  // Only allow users to delete their own account
  if (parseInt(id) !== req.user.id) {
    return res.status(403).json({ message: "You can only delete your own account" });
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json(error);

  res.json({ message: "User deleted successfully" });
});


export default router;
