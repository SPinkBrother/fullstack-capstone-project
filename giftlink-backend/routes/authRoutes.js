const express = require('express');
const app = express();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger

const {body, validationResult} = require('express-validator')

const logger = pino();  // Create a Pino logger instance

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// {Insert it along with other imports} Task 1: Use the `body`,`validationResult` from `express-validator` for input validation

router.put('/update', async (req, res) => {
    const error =  validationResult(req);
    if(!errors.isEmpty()) {
        logger.error('Validation error is update request', errors.array());
        return res.status(400).json({ errors: errors.array()});
    }
    try {
        // Task 3: Check if `email` is present in the header and throw an appropriate error message if not present.
        const email = req.headers.email;
        if(!email) {
            logger.error('Email not found in the request headers');
            return res.status(400).json({ error: "Emaik not found in the request headers"})
        }
        // Task 4: Connect to db
        const db = await connectToDatabase();

		// Task 5: find user credentials in database
        const collection = db.collection("users");
        const existingUser = await collection.findOne({ email });

		existingUser.updatedAt = new Date();

		// Task 6: update user credentials in database
        const updatedUser = await collection.findOneUpdate(
            {email},
            {$set: existingUser},
            {returnDocument: 'after'}
        )
		// Task 7: create JWT authentication using secret key from .env file
        const payload = {
            user: {
                id: updatedUser._id.toString(),
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);

        res.json({authtoken});
    } catch (e) {
         return res.status(500).send('Internal server error');

    }
});



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
