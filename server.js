import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize database tables
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        category VARCHAR,
        likes INTEGER,
        ig_followers INTEGER,
        last_updated TIMESTAMP,
        search_result JSONB
      );

      CREATE TABLE IF NOT EXISTS ads (
        ad_archive_id VARCHAR PRIMARY KEY,
        page_id VARCHAR REFERENCES pages(id),
        snapshot JSONB,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        last_updated TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
};

initDb();

// Search advertisers endpoint
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

    // Store results in PostgreSQL
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const result of data.results) {
        await client.query(
          `INSERT INTO pages (id, name, category, likes, ig_followers, last_updated, search_result)
           VALUES ($1, $2, $3, $4, $5, NOW(), $6)
           ON CONFLICT (id) DO UPDATE SET
           name = $2, category = $3, likes = $4, ig_followers = $5, 
           last_updated = NOW(), search_result = $6`,
          [
            result.id,
            result.name,
            result.category,
            result.likes,
            result.igFollowers,
            result
          ]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get page ads endpoint
app.get('/api/page-ads/:pageId', async (req, res) => {
  const { pageId } = req.params;
  const { country_code = 'US' } = req.query;

  try {
    // Check cache first
    const client = await pool.connect();
    try {
      const cachedAds = await client.query(
        `SELECT * FROM ads 
         WHERE page_id = $1 
         AND last_updated > NOW() - INTERVAL '24 hours'`,
        [pageId]
      );

      if (cachedAds.rows.length > 0) {
        return res.json({ results: cachedAds.rows });
      }

      // Fetch from API if not cached
      const response = await fetch(
        `https://ad-libraries.p.rapidapi.com/meta/page/ads?page_id=${pageId}&country_code=${country_code}&platform=facebook%2Cinstagram&media_types=all&active_status=all`,
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

      // Store ads in PostgreSQL
      await client.query('BEGIN');
      
      await client.query('DELETE FROM ads WHERE page_id = $1', [pageId]);
      
      for (const result of data.results.flat()) {
        await client.query(
          `INSERT INTO ads (ad_archive_id, page_id, snapshot, start_date, end_date, last_updated)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            result.adArchiveID,
            pageId,
            result.snapshot,
            new Date(result.startDate * 1000),
            new Date(result.endDate * 1000)
          ]
        );
      }
      
      await client.query('COMMIT');
      res.json(data);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
