const QuestionSet = require('../models/QuestionSet');

// Get all question sets
exports.getAllSets = async (req, res) => {
  try {
    const sets = await QuestionSet.find().sort({ createdAt: -1 });
    res.json(sets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one set
exports.getSet = async (req, res) => {
  try {
    const set = await QuestionSet.findById(req.params.id);
    if (!set) return res.status(404).json({ error: 'Not found' });
    res.json(set);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create set
exports.createSet = async (req, res) => {
  try {
    const { setName, questions } = req.body;
    const set = new QuestionSet({ setName, questions });
    await set.save();
    res.status(201).json(set);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update set
exports.updateSet = async (req, res) => {
  try {
    const set = await QuestionSet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!set) return res.status(404).json({ error: 'Not found' });
    res.json(set);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete set
exports.deleteSet = async (req, res) => {
  try {
    await QuestionSet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};