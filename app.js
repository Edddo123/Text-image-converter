const express = require("express");
const app = express();
const multer = require("multer");
const fs = require("fs");
const { createWorker } = require("tesseract.js");

app.set("view engine", "ejs");
app.set("views", "views");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

app.use(multer({ storage: fileStorage }).single("image"));

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", (req, res) => {
  let imageData = [];
  console.log(req.file);
  let imageFile = fs.createReadStream(
    `${__dirname}/images/${req.file.originalname}`
  );
  imageFile.on("data", (chunk) => {
    imageData.push(chunk);
  });
  imageFile.on("end", () => {
    //    fs.readFile(`${__dirname}/images/${req.file.originalname}`, (err, imageData) => {
    (async () => {
      const worker = createWorker();
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const {
        data: { text },
      } = await worker.recognize(Buffer.concat(imageData));
      console.log(text);
      const { data } = await worker.getPDF("Tesseract OCR Result");
      fs.writeFileSync("tesseract-ocr-result.pdf", Buffer.from(data));
      console.log("Generate PDF: tesseract-ocr-result.pdf");
      await worker.terminate();
        res.download(`${__dirname}/tesseract-ocr-result.pdf`);
    })();
    //    })
  });
});

app.listen(5099);
