import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
<<<<<<< HEAD:src/routes/studentRoute.js
import { getUserProfile, updateUserProfile } from "../controller/studentController.js";

const router = express.Router();

// GET - get user profile (need login)
router.get("/profile/:userId", authMiddleware, getUserProfile);

// PUT - update user profile (need login)
router.put('/profile/:userId',authMiddleware, updateUserProfile);

export default router;
=======
import { getUserProfile } from "../controller/studentController.js";
const router = express.Router();
router.get("/profile/:userId", authMiddleware, getUserProfile);
export default router;
>>>>>>> e505ed89593444000d6836189a05dc6988b053ae:dist/routes/studentRoute.js
