const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/questionController');

router.get('/', ctrl.getAllSets);
router.get('/:id', ctrl.getSet);
router.post('/', ctrl.createSet);
router.put('/:id', ctrl.updateSet);
router.delete('/:id', ctrl.deleteSet);

module.exports = router;