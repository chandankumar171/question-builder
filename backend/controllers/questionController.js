const QuestionSet = require('../models/QuestionSet');
const cloudinary  = require('../config/cloudinary');

// Extract Cloudinary publicIds from [IMG:publicId|||url] tokens in text
function extractPublicIds(questions = []) {
  const ids = new Set();
  // Matches both new format [IMG:pubId|||url] and old {url,publicId} fields
  const tokenRe = /\[IMG:([^|]+)\|\|\|[^\]]+\]/g;

  const scan = (text) => {
    if (!text) return;
    tokenRe.lastIndex = 0;
    let m;
    while ((m = tokenRe.exec(text)) !== null) ids.add(m[1]);
  };

  questions.forEach(q => {
    scan(q.question);
    scan(q.answer);
    ['A','B','C','D'].forEach(k => scan(q.options?.[k]));
  });

  return [...ids].filter(Boolean);
}

async function deleteCloudinaryImages(publicIds) {
  if (!publicIds.length) return;
  for (let i = 0; i < publicIds.length; i += 100) {
    await cloudinary.api.delete_resources(publicIds.slice(i, i + 100)).catch(console.error);
  }
}

exports.getAllSets = async (req, res) => {
  try {
    res.json(await QuestionSet.find().sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSet = async (req, res) => {
  try {
    // Strip query string (?t=...) from id to avoid mongoose cast error
    const id = req.params.id.split('?')[0];
    const set = await QuestionSet.findById(id);
    if (!set) return res.status(404).json({ error: 'Not found' });
    res.json(set);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createSet = async (req, res) => {
  try {
    const set = new QuestionSet({ setName: req.body.setName, questions: req.body.questions });
    await set.save();
    res.status(201).json(set);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.updateSet = async (req, res) => {
  try {
    const old = await QuestionSet.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Not found' });

    // Delete images removed in this update
    const oldIds = new Set(extractPublicIds(old.questions));
    const newIds = new Set(extractPublicIds(req.body.questions || []));
    const removed = [...oldIds].filter(id => !newIds.has(id));
    if (removed.length) deleteCloudinaryImages(removed).catch(console.error);

    const set = await QuestionSet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(set);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.deleteSet = async (req, res) => {
  try {
    const set = await QuestionSet.findByIdAndDelete(req.params.id);
    if (set) {
      const ids = extractPublicIds(set.questions);
      if (ids.length) deleteCloudinaryImages(ids).catch(console.error);
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
