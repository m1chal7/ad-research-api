# Ad Research API

Backend proxy server for Ad Libraries API.

## Setup

```bash
# Install dependencies
npm install

# Start server
npm start

# Start development server
npm run dev
```

## Environment Variables

- `RAPIDAPI_KEY`: Your RapidAPI key
- `PORT`: Server port (optional, defaults to 3001)

## API Endpoints

### GET /api/search-advertisers

Search for advertisers in the Ad Libraries database.

Parameters:
- `query`: Search term (required)
- `country_code`: Country code (optional, defaults to 'PL')

Example:
```bash
curl "http://localhost:3001/api/search-advertisers?query=apple&country_code=US"
```

## Deployment

This API can be deployed to various platforms:

### Render
1. Create a new Web Service
2. Connect your GitHub repository
3. Add environment variable: `RAPIDAPI_KEY`
4. Deploy

### Railway
1. Create new project
2. Connect your GitHub repository
3. Add environment variable: `RAPIDAPI_KEY`
4. Deploy