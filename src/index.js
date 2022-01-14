const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
require("./db/connect");
const PORT = process.env.PORT || 4000;
console.log("PORT: " + PORT);
const userRoutes = require("./routes/user");
app.use(express.json());
app.use(cookieParser());

app.use(userRoutes);

app.listen(PORT);
