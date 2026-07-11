const express = require('express');
const app = express();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger


const logger = pino();

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
router.post('/register', async(req,res)=> {
    try{

        const db = await connectToDatabase();
        const collection = db.collection("users");
    
        const existingEmail = await collection.findOne({email: req.body.email})
    
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
        const email = req.body.email; 
    
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName : req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createAt : new Date(),
    
        });
    
        const payload = {
            user: {
                id: newUser.insertedId,
            }
        };
    
        const authtoken = jwt.sign(payload, JWT_SECRET);
        logger.info('Use registered successfully');
        res.json({authtoken,email});
    } catch(e) {
        return res.status(500).json('Internal server error');
    }

})

module.exports = router;