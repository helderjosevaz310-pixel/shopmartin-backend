const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 1, max: 120 }).withMessage("Nome obrigatório"),
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password").isLength({ min
