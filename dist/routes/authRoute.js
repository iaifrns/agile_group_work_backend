"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controller/authController");
const router = express_1.default.Router();
// Authentication routes
router.post("/register", authController_1.register); // Create new user account
router.post("/login", authController_1.login); // Authenticate and get token
router.get("/logout", authController_1.logout); // Clear authentication cookie
router.get("/check_token", authController_1.check_token); // Verify token validity
exports.default = router;
