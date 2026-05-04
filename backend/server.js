// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const path = require('path');

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use('/api/questions', require('./routes/questionRoutes'));
// app.use('/api/excel', require('./routes/excelRoutes'));

// // MongoDB Connection
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/questionbuilder';
// mongoose.connect(MONGO_URI)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('❌ MongoDB connection error:', err));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));





const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
// Standard 1mb limit — images go through Cloudinary, not as base64 in JSON
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Routes
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/excel',     require('./routes/excelRoutes'));
app.use('/api/images',    require('./routes/imageRoutes'));

// MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/questionbuilder';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));