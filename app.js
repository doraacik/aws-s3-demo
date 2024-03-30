const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { fromEnv } = require("@aws-sdk/credential-provider-env");
const multer = require('multer');
const express = require('express')

const storage = multer.memoryStorage();
require('dotenv').config();
const app = express()

const credentialsProvider = fromEnv({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

const s3Client = new S3Client({
  credentials: credentialsProvider,
  region: "eu-west-1" 
});

const path = require('path');
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(null, false);
    }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: fileFilter
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;

  const params = {
    Bucket: "lab-test-dora",
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    res.status(200).send('File uploaded to S3 successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file to S3');
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    res.status(400).send('Error uploading file: ' + error.message);
  } else if (error) {
    res.status(400).send('Error: ' + error.message);
  } else {
    next();
  }
});

app.listen(3000, () => {
  console.log('Up on port 3000');
});
