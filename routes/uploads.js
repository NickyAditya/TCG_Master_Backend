import express from "express";
import multer from "multer";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("cardImage"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file" });
  }

  res.json({
    message: "Uploaded",
    filename: req.file.filename
  });
});

export default router;