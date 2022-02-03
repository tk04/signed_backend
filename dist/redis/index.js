"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const redis = require("redis");
const redis_1 = require("redis");
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
const client = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASS,
});
client.connect();
exports.default = client;
