const express = require("express");
const redis = require("redis");
var cors = require('cors')
const axios = require("axios");

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;


// Create a redis client that is fresh
let redisClient;
(async () => {
  redisClient = redis.createClient();
  redisClient.on("error", (error) => console.error(`Redis Error: ${error}`));
  await redisClient.connect();

  try {
    await redisClient.flushDb();
    console.log('Redis cache cleared successfully');
  } catch (err) {
      console.error('Error clearing Redis cache:', err);
  }
  
})();

// Fixed List of Countries
const COUNTRIES = [
  "United States", "Canada", "Germany", "France", "Japan",
  "Australia", "Brazil", "India", "South Africa", "Mexico",
  "Colombia", "Netherlands", "Argentina", "Venezuela", "Ecuador",
  "Paraguay", "Uruguay", "Suriname", "Guyana", "Chile" 
];

// Uses API to get the capitals
async function fetchCapitals() {
  const start = Date.now();
  let capitals = {};

  for (const country of COUNTRIES) {
    console.log(`Fetching capital of ${country}...`);
    const response = await axios.get(`https://restcountries.com/v3.1/name/${country}?fields=capital`);
    capitals[country] = response.data[0].capital[0];
  }

  const end = Date.now();
  console.log(`API Call Time: ${end - start}ms`);

  return { timeTaken: `${end - start}ms`, capitals };
}

// No Caching - Calls API 10 times every request
app.get("/nocache", async (req, res) => {
  try {
    const result = await fetchCapitals();
    res.json({ fromCache: false, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching capitals.");
  }
});

// With Redis Caching - Calls API once, caches for 1 hour
app.get("/cache", async (req, res) => {
  try {
    const cacheStart = Date.now();
    const cacheResults = await redisClient.get("capitals");
    const cacheEnd = Date.now();

    if (cacheResults) {
      console.log(`Retrieval Time: ${cacheEnd - cacheStart}ms`);
      return res.json({ fromCache: true, timeTaken: `${cacheEnd - cacheStart}ms`, capitals: JSON.parse(cacheResults) });
    }

    console.log(`No cache found, fetching from API...`);
    const result = await fetchCapitals();

    await redisClient.setEx("capitals", 3600, JSON.stringify(result.capitals)); // Cache for 1 hour
    res.json({ fromCache: false, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching capitals.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
