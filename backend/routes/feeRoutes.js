
const express = require('express');
const router = express.Router();
const { createFeeRecord, getFees, getStudentFees } = require('../controllers/feeController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Fees
 *   description: Fee management API
 */

/**
 * @swagger
 * /fees:
 *   post:
 *     summary: Create a new fee record
 *     tags: [Fees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fee record created
 */
router.post('/', createFeeRecord);

/**
 * @swagger
 * /fees:
 *   get:
 *     summary: Get all fee records
 *     tags: [Fees]
 *     responses:
 *       200:
 *         description: List of fees
 */
router.get('/', getFees);
router.get('/student/:studentId', getStudentFees);

module.exports = router;
