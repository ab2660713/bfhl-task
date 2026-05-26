const express = require("express");
const { sendError } = require("../middleware/errorHandler");

const router = express.Router();

function getUserId() {
  if (process.env.BFHL_USER_ID) {
    return process.env.BFHL_USER_ID;
  }

  const name = (process.env.BFHL_FULL_NAME || "ankitbindal")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const dob = process.env.BFHL_DOB || "18042005";

  return `${name}_${dob}`;
}

function isIntegerString(value) {
  return /^-?\d+$/.test(value);
}

function buildAlternatingConcat(alphabetItems) {
  const chars = alphabetItems
    .join("")
    .split("")
    .filter((char) => /[a-z]/i.test(char))
    .reverse();

  return chars
    .map((char, index) => (index % 2 === 0 ? char.toUpperCase() : char.toLowerCase()))
    .join("");
}

router.post("/", (req, res) => {
  const data = req.body?.data;

  if (!Array.isArray(data)) {
    return sendError(res, 400, "Request body must include data as an array");
  }

  const oddNumbers = [];
  const evenNumbers = [];
  const alphabets = [];
  const specialCharacters = [];
  let sum = 0;

  for (const item of data) {
    const value = String(item);

    if (isIntegerString(value)) {
      const number = Number(value);
      sum += number;

      if (Math.abs(number) % 2 === 0) {
        evenNumbers.push(value);
      } else {
        oddNumbers.push(value);
      }
    } else if (/^[a-z]+$/i.test(value)) {
      alphabets.push(value.toUpperCase());
    } else {
      specialCharacters.push(value);
    }
  }

  return res.status(200).json({
    is_success: true,
    user_id: getUserId(),
    email: process.env.BFHL_EMAIL || "ankitbindal230528@acropolis.in",
    roll_number: process.env.BFHL_ROLL_NUMBER || "0827CS231038",
    odd_numbers: oddNumbers,
    even_numbers: evenNumbers,
    alphabets,
    special_characters: specialCharacters,
    sum: String(sum),
    concat_string: buildAlternatingConcat(alphabets)
  });
});

module.exports = router;
