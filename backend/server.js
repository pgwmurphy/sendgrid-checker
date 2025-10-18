const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for your React app
app.use(cors());
app.use(express.json());

// Proxy endpoint for SendGrid campaigns
app.get('/api/campaigns', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  console.log('Received request for campaigns');
  
  if (!apiKey) {
    console.error('No API key provided');
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    console.log('Fetching campaigns from SendGrid');
    const response = await fetch('https://api.sendgrid.com/v3/marketing/singlesends', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('SendGrid campaigns response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log(`Found ${data.result?.length || 0} campaigns`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for email activity
app.get('/api/messages', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const query = req.query.query;
  const limit = req.query.limit || 1;
  
  console.log('Received request for messages:', { query, limit });
  
  if (!apiKey) {
    console.error('No API key provided');
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const url = `https://api.sendgrid.com/v3/messages?query=${encodeURIComponent(query)}&limit=${limit}`;
    console.log('Fetching from SendGrid:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('SendGrid response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log('SendGrid data:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
