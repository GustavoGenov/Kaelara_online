// src/lib/internalServer.js
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// --------- Search (internal browser) ---------
app.get('/search', (req, res) => {
  const query = req.query.q || '';
  const scriptPath = path.resolve('D:/Kaelara/navegador/kae_spider.py');
  const py = spawn('python', [scriptPath, query]);

  let output = '';
  py.stdout.on('data', (data) => (output += data.toString()));
  py.stderr.on('data', (err) => console.error('py error:', err.toString()));

  py.on('close', (code) => {
    res.json({ result: output, code });
  });
});

// --------- Execute arbitrary JS code (sandboxed) ---------
import { NodeVM } from 'vm2';
app.post('/execute', (req, res) => {
  const { code } = req.body;
  try {
    const vm = new NodeVM({ console: 'redirect', sandbox: {} });
    const result = vm.run(code);
    res.json({ result: String(result) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


// --------- File upload (document) ---------
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
  // For demo, just acknowledge receipt.
  res.json({ filename: req.file.filename, original: req.file.originalname });
});

// --------- Feedback (email stub) ---------
app.post('/feedback', (req, res) => {
  const { message } = req.body;
  const logLine = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync('feedback.log', logLine);
  res.json({ status: 'saved' });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Kaelara internal server listening on http://localhost:${PORT}`));
