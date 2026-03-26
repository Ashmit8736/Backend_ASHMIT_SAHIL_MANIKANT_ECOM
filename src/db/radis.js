// module.exports = redis;
const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 15000, // 15 sec
    keepAlive: 5000,
  },
});

redis.on("connect", () => console.log("🔥 Redis Connected"));
redis.on("ready", () => console.log("⚡ Redis Ready"));
redis.on("error", (err) => console.error("❌ Redis Error:", err.message));
redis.on("end", () => console.log("🔌 Redis Closed"));

(async () => {
  try {
    await redis.connect();
  } catch (err) {
    console.error("❌ Redis connect failed:", err.message);
  }
})();

module.exports = redis;
