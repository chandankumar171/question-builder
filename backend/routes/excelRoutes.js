const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const mammoth = require('mammoth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/excel/template
// Download the single unified Excel template
// ─────────────────────────────────────────────────────────────────────────────
router.get('/template', (req, res) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'type', 'question', 'answer',
    'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer',
  ];

  const sampleRows = [
    ['normal', 'What is the capital of India?', 'New Delhi', '', '', '', '', ''],
    ['mcq', 'What is 2 + 2?', '', '3', '4', '5', '6', 'B'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);

  res.setHeader('Content-Disposition', 'attachment; filename="questions_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.end(buffer);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/excel/word-template
// Download a Word (.docx) template showing the expected format
// We generate a minimal docx by writing raw XML (no extra dependency needed)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/word-template', (req, res) => {
  // We'll return a plain .txt file that explains the Word format,
  // since generating a real .docx without extra deps is complex.
  // The user can copy this into a Word doc and save as .docx
  const content = `WORD FILE FORMAT FOR QUESTION IMPORT
=====================================

Write each question in ONE of these two formats:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT 1 — NORMAL QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: What is photosynthesis?
A: The process by which plants convert sunlight into food.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT 2 — MCQ QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: What is the capital of India?
A) Mumbai
B) New Delhi
C) Chennai
D) Kolkata
ANS: B

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every question must start with "Q:" on its own line
- For normal questions: answer line starts with "A:"
- For MCQ: options are lines starting with A) B) C) D)
- For MCQ: correct answer line starts with "ANS:"
- Leave a blank line between questions
- Answer / ANS lines are optional

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE DOCUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: What is the capital of France?
A: Paris

Q: Which planet is closest to the Sun?
A) Venus
B) Mercury
C) Mars
D) Earth
ANS: B

Q: What is Newton's first law of motion?
A: An object at rest stays at rest unless acted upon by an external force.

Q: What is the chemical formula of water?
A) CO2
B) H2O2
C) H2O
D) NaCl
ANS: C
`;

  res.setHeader('Content-Disposition', 'attachment; filename="word_question_format.txt"');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(content);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/excel/parse
// Parse an uploaded Excel (.xlsx/.xls) OR Word (.docx/.doc) file
// ─────────────────────────────────────────────────────────────────────────────
router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const name = req.file.originalname.toLowerCase();

    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      // ── DOCX parsing ──────────────────────────────────────────────────────
      return await parseDocx(req.file.buffer, res);
    } else {
      // ── Excel parsing ─────────────────────────────────────────────────────
      return parseExcel(req.file.buffer, res);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Excel parser (existing logic)
// ─────────────────────────────────────────────────────────────────────────────
function parseExcel(buffer, res) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  if (rows.length < 2) return res.status(400).json({ error: 'File is empty or has no data rows' });

  const headers = rows[0].map(h => h.toString().toLowerCase().trim());
  const questions = [];
  const errors = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
    });

    const type = rowObj['type']?.toLowerCase();
    const question = rowObj['question'];

    if (!question) { errors.push(`Row ${i + 1}: Missing question`); continue; }

    if (type === 'normal') {
      questions.push({
        type: 'normal',
        question,
        answer: rowObj['answer'] || '',
        options: { A: '', B: '', C: '', D: '' },
        correctOption: '',
      });
    } else if (type === 'mcq') {
      const opts = {
        A: rowObj['option_a'] || '',
        B: rowObj['option_b'] || '',
        C: rowObj['option_c'] || '',
        D: rowObj['option_d'] || '',
      };
      const correct = rowObj['correct_answer']?.toUpperCase() || '';
      questions.push({
        type: 'mcq',
        question,
        options: opts,
        correctOption: correct,
        answer: opts[correct] || '',
      });
    } else {
      errors.push(`Row ${i + 1}: Invalid type "${type}" — must be 'normal' or 'mcq'`);
    }
  }

  return res.json({ questions, errors });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCX parser
//
// Expected format in the Word document (each question block separated by
// one or more blank lines):
//
//   Normal question:
//     Q: What is photosynthesis?
//     A: The process by which plants make food.
//
//   MCQ question:
//     Q: What is the capital of India?
//     A) Mumbai
//     B) New Delhi
//     C) Chennai
//     D) Kolkata
//     ANS: B
//
// Rules:
//   - Question line starts with  Q:  (case-insensitive)
//   - Normal answer starts with  A:  (colon, not closing paren)
//   - MCQ options are lines starting with  A)  B)  C)  D)
//   - MCQ answer starts with  ANS:
//   - Answer / ANS lines are optional
// ─────────────────────────────────────────────────────────────────────────────
async function parseDocx(buffer, res) {
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value;

  // Split into non-empty lines, normalise whitespace
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const questions = [];
  const errors = [];

  // Group lines into question blocks (each block starts with Q:)
  const blocks = [];
  let current = null;

  for (const line of lines) {
    if (/^Q\s*:/i.test(line)) {
      if (current) blocks.push(current);
      current = [line];
    } else if (current) {
      current.push(line);
    }
    // Lines before first Q: are ignored
  }
  if (current) blocks.push(current);

  if (blocks.length === 0) {
    return res.status(400).json({
      error: 'No questions found. Make sure each question starts with "Q:" on its own line.',
    });
  }

  blocks.forEach((block, bi) => {
    const qLine = block[0].replace(/^Q\s*:\s*/i, '').trim();
    if (!qLine) { errors.push(`Block ${bi + 1}: Empty question text`); return; }

    // Detect if MCQ by checking for A) B) C) D) options
    const optionLines = block.filter(l => /^[A-D]\s*\)/i.test(l));
    const isMCQ = optionLines.length > 0;

    if (isMCQ) {
      const opts = { A: '', B: '', C: '', D: '' };
      optionLines.forEach(l => {
        const key = l[0].toUpperCase();
        opts[key] = l.replace(/^[A-D]\s*\)\s*/i, '').trim();
      });

      const ansLine = block.find(l => /^ANS\s*:/i.test(l));
      const correct = ansLine
        ? ansLine.replace(/^ANS\s*:\s*/i, '').trim().toUpperCase()
        : '';

      // Validate correct answer key
      const validKey = ['A', 'B', 'C', 'D'].includes(correct);

      questions.push({
        type: 'mcq',
        question: qLine,
        options: opts,
        correctOption: validKey ? correct : '',
        answer: validKey ? opts[correct] : '',
      });
    } else {
      // Normal question — look for A: line
      const ansLine = block.find(l => /^A\s*:/i.test(l));
      const answer = ansLine ? ansLine.replace(/^A\s*:\s*/i, '').trim() : '';

      questions.push({
        type: 'normal',
        question: qLine,
        answer,
        options: { A: '', B: '', C: '', D: '' },
        correctOption: '',
      });
    }
  });

  return res.json({ questions, errors });
}

module.exports = router;