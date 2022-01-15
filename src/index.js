const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const path = require("path");
require("./db/connect");
const postImgPath = path.join(__dirname, "../uploads/");
app.use("/images/posts", express.static(postImgPath)); // you can access image
const PORT = process.env.PORT || 4000;
console.log("PORT: " + PORT);
const userRoutes = require("./routes/user");
const postRouter = require("./routes/post");
app.use(express.json());
app.use(cookieParser());

app.use(userRoutes);
app.use(postRouter);

app.listen(PORT);
