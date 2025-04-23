import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL as string
})

export async function connectRedis() {
  
  client.on("error", (err) => {
    console.log("Redis Client Error", err);
  });

  await client.connect();
  console.log("Redis connected");

  return client;
}
