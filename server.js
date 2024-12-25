import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Main search endpoint
app.get('/api/search-advertisers', async (req, res) => {
  const { query, country_code } = req.query;
  console.log('Received request:', { query, country_code });

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const url = `https://ad-libraries.p.rapidapi.com/meta/search/pages?query=${encodeURIComponent(query)}&country_code=${country_code || 'PL'}`;
    console.log('Requesting:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'ad-libraries.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Let Render assign the port
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    nodeEnv: process.env.NODE_ENV,
    hasRapidApiKey: !!process.env.RAPIDAPI_KEY
  });
});
