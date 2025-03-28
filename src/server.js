const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Constants for API - использование бесплатного API
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoint to fetch currency rates
app.get('/api/rates', async (req, res) => {
  try {
    // Fetch latest exchange rates from the free Exchange Rate API
    const response = await axios.get(EXCHANGE_RATE_API);

    // Extract and format the data
    const { rates, time_last_update_utc, base_code } = response.data;
    
    // Return the rates, base currency and timestamp
    res.json({
      base: base_code,
      rates,
      timestamp: new Date(time_last_update_utc).toISOString()
    });
  } catch (error) {
    console.error('Error fetching rates:', error.message);
    
    // Handle network errors or API unavailability
    return res.status(500).json({ 
      error: 'Failed to fetch currency rates',
      message: error.message,
      // Provide fallback data for testing when API is unavailable
      fallback: {
        base: 'USD',
        rates: {
          USD: 1,
          EUR: 0.85,
          GBP: 0.73,
          JPY: 110.25,
          CAD: 1.25,
          AUD: 1.33,
          CHF: 0.92,
          CNY: 6.45,
          INR: 74.38,
          RUB: 73.21,
          UAH: 27.85,
          BYN: 2.53,
          TRY: 8.65,
          SGD: 1.35,
          MXN: 20.18,
          PLN: 3.85,
          SEK: 8.54
        },
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 