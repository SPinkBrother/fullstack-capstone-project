const express = require('express');
const app = express();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger

const logger = pino();  // Create a Pino logger instance

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
// Register routes
router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `giftsdb` in MongoDB through `connectToDatabase` in `db.js`
        const db = await connectToDatabase();
        console.log("Connected DB");

        // Task 2: Access MongoDB collection
        const collection = db.collection("users");

		//Task 3: Check for existing email
        const existingEmail = await collection.findOne({ email: req.body.email });

		const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
		const email = req.body.email;

		//Task 4: Save user details in database
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });

        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);
        logger.info('User registered successfully');
        res.json({authtoken,email});
    } catch (e) {
        console.log(e);
        return res.status(500).send('Internal server error');
    }
});

// Login routes
router.post('/login', async (req, res) => {
    try {
        // Connect to db
        const db = await connectToDatabase();
        // Connect to user collection
        const collection = db.collection("users");
        // Check user credentials
        const theUser = await collection.findOne({ email: req.body.email });
        // Check password
        if (theUser) {
            let result = await bcryptjs.compare(req.body.password, theUser.password);

            if(!result) {
                logger.error('Password do not match');
                return res.status(404).json({ error: 'Wrong password '})
            }

                        // JWT for user password
            let payload= {
                user: {
                    id: theUser._id.toString()
                },
            };
            const userName = theUser.firstName;
            const userEmail = theUser.email;
    
            const authtoken = jwt.sign(payload, JWT_SECRET);
            logger.info('User logged in successfully');
            return res.status(200).json({authtoken, userName, userEmail });
        } else {
            logger.error("User not found");
            return res.status(404).json({ error: 'Internal server error'});
        }
    } catch (e) {
         return res.status(500).send('Internal server error');

    }
});


module.exports = router;
