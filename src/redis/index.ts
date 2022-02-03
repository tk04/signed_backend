// const redis = require("redis");
import { createClient } from "redis";
const red = async () => {
  const client = createClient();
  await client.connect();
  return client;
  //   await client.set("tk", JSON.stringify({ tk: "test" }));
  //   const val = await client.get("tk");
  //   console.log(JSON.parse(val!).tk);
  //   await client.disconnect();
};
// const client = red();

export default red;
