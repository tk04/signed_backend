const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
require("./db/connect");
const PORT = 4000 || process.env.PORT;
const userRoutes = require("./routes/user");
app.set("trust proxy", true); // specify a single subnet
app.use(express.json());
app.use(cookieParser());

app.use(userRoutes);

app.listen(PORT);
