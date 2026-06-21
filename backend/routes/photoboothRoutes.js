const express = require('express');
const router = express.Router();
const photoboothController = require('../controllers/photoboothController');
const { verifyToken } = require('../middlewares/verifyToken');
const multer = require('multer');

const uploadTemplate = multer({ storage: multer.memoryStorage() });

router.get('/templates', photoboothController.getTemplates);
router.post('/templates', verifyToken, uploadTemplate.single('background_image'), photoboothController.createTemplate);
router.delete('/templates/:id', verifyToken, photoboothController.deleteTemplate);

router.get('/filters', photoboothController.getFilters);
router.post('/sessions', verifyToken, photoboothController.createSession);

router.post('/results/generate', verifyToken, photoboothController.uploadPhotos, photoboothController.generateResult);
router.get('/history', verifyToken, photoboothController.getHistory);
router.delete('/history/all', verifyToken, photoboothController.clearAllHistory);
router.delete('/history/:id', verifyToken, photoboothController.deleteHistoryItem);

router.put('/templates/:id', verifyToken, photoboothController.updateTemplate);

module.exports = router;
