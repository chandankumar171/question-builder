const mongoose = require('mongoose');

// Images are stored as inline tokens inside text fields:
//   [IMG:publicId|||https://res.cloudinary.com/...]
// This means question, answer, and options can each contain
// multiple images + math + text mixed freely.
// No separate image fields needed.

const questionSchema = new mongoose.Schema({
  setName:   { type: String, required: true },
  questions: [
    {
      type:          { type: String, enum: ['normal', 'mcq'], required: true },
      question:      { type: String, required: true },
      answer:        { type: String, default: '' },
      options: {
        A: { type: String, default: '' },
        B: { type: String, default: '' },
        C: { type: String, default: '' },
        D: { type: String, default: '' },
      },
      correctOption: { type: String, default: '' },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QuestionSet', questionSchema);
