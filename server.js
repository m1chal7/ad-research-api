const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for your frontend
app.use(cors());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Route to handle advertiser search
app.get('/api/search-advertisers', async (req, res) => {
  const { query, country_code } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await fetch(
      `https://ad-libraries.p.rapidapi.com/meta/search/pages?query=${encodeURIComponent(query)}&country_code=${country_code || 'PL'}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'ad-libraries.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});