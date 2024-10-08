const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const ExpressBrute = require('express-brute');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());

// MongoDB connection URI
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

// Connect to MongoDB and start the server after the DB connection
async function connectToMongoDB() {
  try {
    await client.connect();
    db = client.db('Apds123');
    console.log('Connected to MongoDB successfully');
    
    // Start the HTTPS Server after DB initialization
    const options = {
      key: fs.readFileSync('./keys/selfsigned.key'),
      cert: fs.readFileSync('./keys/selfsigned.pem')
    };
    
    https.createServer(options, app).listen(port, () => {
      console.log(`Server running at https://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}
connectToMongoDB();

// Helper function to validate input using regex patterns
function validateInput({ username, password, fullName, idNumber, accountNumber }) {
  const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
  const passwordPattern = /^[a-zA-Z0-9@#$%^&*]{6,20}$/;
  const namePattern = /^[a-zA-Z\s]{1,50}$/;
  const idNumberPattern = /^[0-9]{6,20}$/;
  const accountNumberPattern = /^[0-9]{6,20}$/;

  return (
    usernamePattern.test(username) &&
    passwordPattern.test(password) &&
    namePattern.test(fullName) &&
    idNumberPattern.test(idNumber) &&
    accountNumberPattern.test(accountNumber)
  );
}

// Helper function to validate payment data
function validatePaymentData({ amount, currency, provider, accountNumber, swiftCode }) {
  const amountPattern = /^\d+(\.\d{1,2})?$/;
  const currencyPattern = /^[A-Z]{3}$/;
  const providerPattern = /^[A-Za-z]{3,20}$/;
  const accountNumberPattern = /^[0-9]{6,20}$/;
  const swiftCodePattern = /^[A-Z0-9]{8,11}$/;

  return (
    amountPattern.test(amount.toString()) &&
    currencyPattern.test(currency) &&
    providerPattern.test(provider) &&
    accountNumberPattern.test(accountNumber) &&
    swiftCodePattern.test(swiftCode)
  );
}

// Brute-force protection with custom callbacks
const store = new ExpressBrute.MemoryStore();

const failCallback = (req, res, next, nextValidRequestDate) => {
  res.status(429).json({
    error: 'Too many attempts, please try again later.',
    retryAfter: nextValidRequestDate
  });
};

const handleStoreError = (error, req, res, next) => {
  res.status(500).json({ error: 'Server error, please try again later.' });
};

const bruteforce = new ExpressBrute(store, {
  freeRetries: 5,
  minWait: 30 * 1000,
  maxWait: 15 * 60 * 1000,
  lifetime: 15 * 60,
  failCallback,
  handleStoreError
});

// Sign-up Endpoint
app.post('/signup', bruteforce.prevent, async (req, res) => {
  const { username, password, fullName, idNumber, accountNumber } = req.body;

  if (!username || !password || !fullName || !idNumber || !accountNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!validateInput({ username, password, fullName, idNumber, accountNumber })) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    const existingUser = await db.collection('users').findOne({ username, accountNumber });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      username,
      password: hashedPassword,
      fullName,
      idNumber,
      accountNumber
    });
    res.status(201).json({ message: 'User created successfully', userId: result.insertedId });
  } catch (err) {
    console.error('Error during user registration:', err);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login Endpoint
app.post('/login', bruteforce.prevent, async (req, res) => {
  const { username, accountNumber, password } = req.body;

  if (!username || !accountNumber || !password) {
    return res.status(400).json({ error: 'Username, account number, and password are required' });
  }

  if (!validateInput({ username, password, accountNumber })) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    const user = await db.collection('users').findOne({ username, accountNumber });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'defaultSecret',
      { expiresIn: '1h' }
    );
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Protected Profile Endpoint
app.get('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret');
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ username: user.username, fullName: user.fullName });
  } catch (err) {
    console.error('Error verifying token:', err);
    res.status(403).json({ error: 'Invalid token' });
  }
});

// Payment Endpoint
app.post('/pay', async (req, res) => {
  const { amount, currency, provider, accountNumber, swiftCode } = req.body;

  if (!amount || !currency || !provider || !accountNumber || !swiftCode) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!validatePaymentData({ amount, currency, provider, accountNumber, swiftCode })) {
    return res.status(400).json({ error: 'Invalid payment data' });
  }

  try {
    const paymentData = {
      amount,
      currency,
      provider,
      accountNumber,
      swiftCode,
      timestamp: new Date()
    };

    const result = await db.collection('payments').insertOne(paymentData);

    if (!result.insertedId) {
      return res.status(500).json({ error: 'Failed to process payment.' });
    }

    res.status(201).json({ message: 'Payment processed successfully', paymentId: result.insertedId });
  } catch (err) {
    console.error('Error during payment processing:', err);
    res.status(500).json({ error: 'Error processing payment' });
  }
});
