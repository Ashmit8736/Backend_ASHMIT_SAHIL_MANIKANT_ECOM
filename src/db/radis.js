
const { createClient } = require("redis");

const redisUrl = `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const redis = createClient({

  username: "default",

  password: process.env.REDIS_PASSWORD,

  socket: {
    host: process.env.REDIS_HOST,

    port: Number(process.env.REDIS_PORT),

    connectTimeout: 15000,

    keepAlive: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Redis Max Retries Reached");
      return 1000; // retry every 1 second
    },
  },
});

// ----------------------------
// EVENTS
// ----------------------------

redis.on("connect", () => {
  console.log("🔥 Redis Connected");
});

redis.on("ready", () => {
  console.log("⚡ Redis Ready");
});

redis.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

redis.on("end", () => {
  console.log("🔌 Redis Closed");
});

// ----------------------------
// CONNECT
// ----------------------------

(async () => {

  try {

    await redis.connect();

  } catch (err) {

    console.error(
      "❌ Redis connect failed:",
      err.message
    );
  }

})();

module.exports = redis;