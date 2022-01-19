const Post = require("../models/post");
const express = require("express");
const auth = require("../middleware/auth");
const sharp = require("sharp");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const fs = require("fs");
var mongoose = require("mongoose");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg images allowed!"));
    }
  },
});

router.post("/api1/posts", auth, async (req, res) => {
  const post = new Post({
    ...req.body,
    owner: mongoose.Types.ObjectId(req.user._id),
  });
  try {
    await post.save();
    res.status(201).send(post);
  } catch (e) {
    res.status(400).send({
      error: e.message,
    });
  }
});
router.post(
  "/api1/posts/:id/images",
  upload.array("images", 4),
  async (req, res) => {
    const post = await Post.findOne({ _id: req.params.id }).populate(
      "owner",
      "username"
    );
    const userFolder = path.join(
      __dirname,
      `../../uploads/${post.owner.username}`
    );
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder);
    }
    let imgArr = [];
    for (const file of req.files) {
      imgArr.push(
        `${req.protocol}://${req.headers.host}/uploads/${post.owner.username}/${
          file.filename.split(".")[0]
        }.png`
      );
      try {
        await sharp(file.path)
          .metadata()
          .then(({ width, height }) =>
            sharp(file.path)
              .rotate()
              .resize(parseInt(width * 0.8), parseInt(height * 0.8), {
                fit: sharp.fit.outside,
              })
              .withMetadata()
              .toFile(
                path.resolve(
                  file.destination,
                  post.owner.username,
                  file.filename.split(".")[0] + ".png"
                )
              )
          );
        fs.unlinkSync(path.join(__dirname, `../../${file.path}`));
      } catch (e) {
        fs.unlinkSync(
          path.join(
            __dirname,
            `../../uploads/${post.owner.username}/${
              file.filename.split(".")[0]
            }.png`
          )
        );
        fs.unlinkSync(path.join(__dirname, `../../${file.path}`));
        return res.status(500).send({ err: e.message });
      }
    }
    post.images = imgArr;

    await post.save();
    res.send({ images: post.images });
  }
);

router.get("/api1/post/:id", async (req, res) => {
  try {
    // const skip = req.query.skip || 0;
    const post = await Post.findOne({
      _id: mongoose.Types.ObjectId(req.params.id),
    });
    // .populate({
    //   path: "comments",
    //   populate: {
    //     path: "owner",
    //     model: "User",
    //     select: "username name avatar",
    //   },
    //   options: {
    //     limit: 3,
    //     skip: skip,
    //   },
    // });
    if (!post) {
      throw new Error();
    }
    res.send(post);
  } catch (e) {
    res.status(404).send({ e: e.message });
  }
});
router.get("/api1/post/:id/comments", async (req, res) => {
  try {
    const skip = parseInt(req.query.skip);
    const post = await Post.findOne({
      _id: mongoose.Types.ObjectId(req.params.id),
    }).populate({
      path: "comments",
      populate: {
        path: "owner",
        model: "User",
        select: "username name avatar",
      },
      options: {
        limit: 3,
        skip,
      },
    });

    if (!post) {
      throw new Error();
    }

    res.send(post.comments);
  } catch (e) {
    res.status(404).send({ e: e.message });
  }
});

router.get("/api1/posts/:uid", async (req, res) => {
  try {
    const skip = parseInt(req.query.skip);
    const posts = await Post.find({
      owner: mongoose.Types.ObjectId(req.params.uid),
      commentTo: undefined,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .skip(skip);
    if (!posts) {
      throw new Error("post not found");
    }
    res.send(posts);
  } catch (e) {
    res.status(404).send();
  }
});
router.post("/api1/posts/:postId/like", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId });
    if (!post) {
      throw new Error("post not found");
    }
    const likesSet = new Set(post.likes);
    if (likesSet.has(req.user.username)) {
      likesSet.delete(req.user.username);
    } else {
      likesSet.add(req.user.username);
    }
    post.likes = Array.from(likesSet);
    await post.save();
    res.send(post);
  } catch (e) {
    res.status(404).send({ e: e.message });
  }
});

router.delete("/api1/post/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.postId,
      owner: mongoose.Types.ObjectId(req.user._id),
    });
    if (post.images.length > 0) {
      for (const image of post.images) {
        const imgLoc = image.split("/uploads");
        const delLoc = path.join(__dirname, `../../uploads${imgLoc[1]}`);
        fs.unlinkSync(delLoc);
      }
    }
    if (!post) {
      throw new Error();
    }
    res.send();
  } catch (e) {
    res.status(404).send();
  }
});
router.get("/api1/feed", auth, async (req, res) => {
  const skip = parseInt(req.query.skip);
  const posts = await Post.find({
    owner: {
      $in: req.user.following,
    },
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .skip(skip);

  res.send({ posts });
});

router.post("/api1/comment/:pid", auth, async (req, res) => {
  try {
    const pid = mongoose.Types.ObjectId(req.params.pid);
    const post = new Post({
      ...req.body,
      commentTo: pid,
      owner: mongoose.Types.ObjectId(req.user._id),
    });
    await post.save();
    const orgPost = await Post.findOne({ _id: pid });
    orgPost.comments.push(mongoose.Types.ObjectId(post._id));

    await orgPost.save();
    res.status(201).send(post);
  } catch (e) {
    res.status(400).send({ e: e.message });
  }
});
module.exports = router;
