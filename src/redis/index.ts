// const redis = require("redis");
import { createClient } from "redis";
// const red = async () => {
//   const client = createClient({
//     url: process.env.REDIS_URL,
//     password: process.env.REDIS_PASS,
//   });
//   await client.connect();
//   return client;
//   //   await client.set("tk", JSON.stringify({ tk: "test" }));
//   //   const val = await client.get("tk");
//   //   console.log(JSON.parse(val!).tk);
//   //   await client.disconnect();
// };
// const client = red();
const client = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASS,
});
client.connect();

export default client;
