const express = require("express");
const redis = require("redis");
var cors = require('cors');
const axios = require("axios");

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

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

const STOCKS = [
  "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA",
  "NFLX", "META", "NVDA", "SPY", "BA"
];

async function fetchStockPrices() {
  const start = Date.now();
  let stockPrices = {};

  for (const stock of STOCKS) {
    console.log(`Fetching price of ${stock}...`);
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stock}?range=1d&interval=1m`);
    stockPrices[stock] = response.data.chart.result[0].meta.regularMarketPrice;
  }

  const end = Date.now();
  console.log(`API Call Time: ${end - start}ms`);

  return { timeTaken: `${end - start}ms`, stockPrices };
}

app.get("/nocache", async (req, res) => {
  try {
    const result = await fetchStockPrices();
    res.json({ fromCache: false, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching stock prices.");
  }
});

app.get("/cache", async (req, res) => {
  try {
    const cacheStart = Date.now();
    const cacheResults = await redisClient.get("stockPrices");
    const cacheEnd = Date.now();

    if (cacheResults) {
      console.log(`Retrieval Time: ${cacheEnd - cacheStart}ms`);
      return res.json({ fromCache: true, timeTaken: `${cacheEnd - cacheStart}ms`, stockPrices: JSON.parse(cacheResults) });
    }

    console.log(`No cache found, fetching from API...`);
    const result = await fetchStockPrices();

    await redisClient.setEx("stockPrices", 3600, JSON.stringify(result.stockPrices)); // Cache for 1 hour
    res.json({ fromCache: false, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching stock prices.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
