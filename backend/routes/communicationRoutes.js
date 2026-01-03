
const express = require('express');
const router = express.Router();
const controller = require('../controllers/communicationController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

// Broadcasts
router.post('/broadcasts', controller.createBroadcast);
router.get('/broadcasts', controller.getBroadcasts);
router.get('/channels', controller.getChannels);

// Tickets
router.post('/tickets', controller.createTicket);
router.get('/tickets', controller.getTickets);
router.put('/tickets/:id', controller.updateTicket);

module.exports = router;
