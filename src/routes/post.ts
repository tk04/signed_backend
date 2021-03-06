const Post = require("../models/post");
// const express = require("express");
import express from "express";
const auth = require("../middleware/auth");
const sharp = require("sharp");
// const multer = require("multer");
import { IRequest } from "../middleware/auth";
import multer from "multer";
const router = express.Router();
const path = require("path");
const fs = require("fs");
var mongoose = require("mongoose");
const { $where } = require("../models/post");
const User = require("../models/user");
import { Request, Response } from "express";
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

router.post("/api1/posts", auth, async (req: IRequest, res: Response) => {
  const post = new Post({
    ...req.body,
    owner: mongoose.Types.ObjectId(req.user._id),
  });
  try {
    await post.save();
    res.status(201).send(post);
  } catch (e: any) {
    res.status(400).send({
      error: e.message,
    });
  }
});

interface IFile extends Request {
  files?: any;
}
router.post(
  "/api1/posts/:id/images",
  upload.array("images", 4),
  async (req: IFile, res) => {
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
          .then(({ width, height }: { width: number; height: number }) =>
            sharp(file.path)
              .rotate()
              .resize(width * 0.8, height * 0.8, {
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
      } catch (e: any) {
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
  } catch (e: any) {
    res.status(404).send({ e: e.message });
  }
});
export interface IQuery extends Request {
  query: { skip: string };
}
router.get("/api1/post/:id/comments", async (req: IQuery, res) => {
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
  } catch (e: any) {
    res.status(404).send({ e: e.message });
  }
});

router.get("/api1/posts/:uid", async (req: IQuery, res) => {
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
router.post("/api1/posts/:postId/like", auth, async (req: IRequest, res) => {
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
  } catch (e: any) {
    res.status(404).send({ e: e.message });
  }
});

router.delete("/api1/post/:postId", auth, async (req: IRequest, res) => {
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
router.get("/api1/feed", auth, async (req: IRequest, res) => {
  const skip = parseInt(req.query.skip);
  const posts = await Post.find({
    owner: {
      $in: [...req.user.following, mongoose.Types.ObjectId(req.user._id)],
    },
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .skip(skip);

  res.send({ posts });
});
router.get("/api1/popular", async (req: IQuery, res) => {
  try {
    const skip = parseInt(req.query.skip);
    const posts = await Post.find({})
      .sort({ likes: -1, createdAt: -1 })
      .skip(skip)
      .limit(4);
    // const agg = Post.aggregate(
    //   [
    //     {
    //       $set: {
    //         numLikes: {
    //           $size: "$likes",
    //         },
    //         numComments: {
    //           $size: "$comments",
    //         },
    //       },
    //     },
    //     {
    //       $sort: {
    //         numLikes: -1,
    //         numComments: -1,
    //       },
    //     },
    //     { $skip: skip },
    //     { $limit: 3 },
    //   ],
    //   (err, cr) => {
    //     if (err) {
    //       throw new Error("error happened while fetching data, try again");
    //     } else {
    //       // Post.populate(
    //       //   cr,
    //       //   { path: "owner", select: "username name avatar" },
    //       //   (err, fp) => {
    //       //     Post.populate(fp, { path: "commentTo" }, (err, final) => {
    //       //       Post.populate(
    //       //         final,
    //       //         { path: "commentTo.owner", select: "username name avatar" },
    //       //         (err, ffinal) => {
    //       //           res.send(final);
    //       //         }
    //       //       );
    //       //     });
    //       //     // res.send(fp);
    //       //   }
    //       // );
    //       res.send(cr);
    //     }
    //   }
    // );
    // console.log(ag/g);
    res.send(posts);
  } catch (e: any) {
    res.status(400).send({ e: e.message });
  }
});

router.post("/api1/comment/:pid", auth, async (req: IRequest, res) => {
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
  } catch (e: any) {
    res.status(400).send({ e: e.message });
  }
});

router.get("/api1/noti", auth, async (req: IRequest, res) => {
  await req.user.populate({
    path: "followers",
    model: "User",
    select: "username",
  });
  const notis = await Post.find(
    {
      owner: mongoose.Types.ObjectId(req.user._id),
    },
    "comments text likes"
  )
    .populate({
      path: "comments",
      populate: {
        path: "owner",
        model: "User",
        select: "username",
      },
      options: {
        limit: 5,
        sort: { createdAt: -1 },
      },
    })
    .sort({ comments: -1 });
  res.send({ notis, newFollowers: req.user.followers });
});
module.exports = router;
