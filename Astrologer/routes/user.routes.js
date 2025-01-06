const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers,
  generateUsers,
} = require("../controller/user.controller.js");



const { verifyToken } = require("../middleware/auth.js");

// Public routes
router.post("/generate", generateUsers);
router.post("/register", registerUser); // Register user
router.post("/login", loginUser); // Login user
router.get("/all", getAllUsers); //fetch all users

// Protected routes (require token)
router.get("/:id", verifyToken, getUserById); // Get user by ID
router.put("/:id", verifyToken, updateUser); // Update user
router.delete("/:id", verifyToken, deleteUser); // Delete user



module.exports = router;
