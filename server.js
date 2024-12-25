import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

// Enable CORS for your frontend
app.use(cors());

// Health check endpoint with more info
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Route to handle advertiser search
app.get('/api/search-advertisers', async (req, res) => {
  const { query, country_code } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    console.log(`Starting search for query: ${query}, country: ${country_code}`);
    console.log('RapidAPI Key present:', !!process.env.RAPIDAPI_KEY);

    const url = `https://ad-libraries.p.rapidapi.com/meta/search/pages?query=${encodeURIComponent(query)}&country_code=${country_code || 'PL'}`;
    console.log('Requesting URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'ad-libraries.p.rapidapi.com'
      }
    });

    console.log('RapidAPI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI error response:', errorText);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received data with results:', data?.results?.length || 0);

    res.json(data);
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      query,
      country_code
    });
    
    res.status(500).json({ 
      error: error.message,
      details: {
        query,
        country_code,
        timestamp: new Date().toISOString()
      }
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment check:', {
    nodeEnv: process.env.NODE_ENV,
    hasRapidApiKey: !!process.env.RAPIDAPI_KEY
  });
});
