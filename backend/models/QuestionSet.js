const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  setName: { type: String, required: true },
  questions: [
    {
      type: { type: String, enum: ['normal', 'mcq'], required: true },
      question: { type: String, required: true },
      answer: { type: String, default: '' },
      options: {
        A: { type: String, default: '' },
        B: { type: String, default: '' },
        C: { type: String, default: '' },
        D: { type: String, default: '' },
      },
      correctOption: { type: String, default: '' },
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QuestionSet', questionSchema);