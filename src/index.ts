require("dotenv-safe").config();
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import createError from "http-errors";
import isUUID from "is-uuid";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github";
import { join } from "path";
import "reflect-metadata";
import { createConnection, getConnection } from "typeorm";
import { __prod__ } from "./constants";
import { createTokens } from "./createTokens";
import { Favorite } from "./entities/Favorite";
import { GifStory } from "./entities/GifStory";
import { Like } from "./entities/Like";
import { TextStory } from "./entities/TextStory";
import { User } from "./entities/User";
import { isAuth } from "./isAuth";
import { Octokit } from "@octokit/rest";
import { fetchStories, fetchUserStories } from "./queryBuilder";
import { Banned } from "./entities/Banned";
import { isBot } from "./isBot";
const octokit = new Octokit();

const upgradeMessage =
  "Upgrade the VSCode Stories extension, I fixed it and changed the API.";

const main = async () => {
  const credentials = {
    host: process.env.SOCKET_PATH
      ? process.env.SOCKET_PATH
      : process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
  console.log("about to connect to db, host: ", credentials.host);

  const conn = await createConnection({
    type: "postgres",
    database: "stories",
    entities: [join(__dirname, "./entities/*")],
    migrations: [join(__dirname, "./migrations/*")],
    // synchronize: !__prod__,
    logging: !__prod__,
    ...credentials,
  });
  console.log("connected, running migrations now");
  await conn.runMigrations();
  console.log("migrations ran");

  passport.use(
    new GitHubStrategy(
      {
        scope: "user:follow",
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
      },
      async (githubAccessToken, _, profile, cb) => {
        if (profile.id === "32990164") {
          cb(new Error("you are banned"));
          return;
        }
        try {
          let user = await User.findOne({ githubId: profile.id });
          const data = {
            githubAccessToken,
            displayName: profile.displayName,
            githubId: profile.id,
            photoUrl:
              profile.photos?.[0].value ||
              (profile._json as any).avatar_url ||
              "",
            other: profile._json,
            profileUrl: profile.profileUrl,
            username: profile.username,
            isBanned: false,
          };
          if (user) {
            await User.update(user.id, data);
          } else {
            user = await User.create(data).save();
          }

          cb(undefined, createTokens(user));
        } catch (err) {
          console.log(err);
          cb(new Error("internal error"));
        }
      }
    )
  );
  passport.serializeUser((user: any, done) => {
    done(null, user.accessToken);
  });

  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: "*", maxAge: 86400 }));
  app.use(bodyParser.json());
  app.use(passport.initialize());

  app.get("/auth/github", passport.authenticate("github", { session: false }));

  app.get(
    "/auth/github/callback",
    passport.authenticate("github"),
    (req: any, res) => {
      if (!req.user.accessToken || !req.user.refreshToken) {
        res.send(`something went wrong`);
        return;
      }
      res.redirect(
        `http://localhost:54321/callback/${req.user.accessToken}/${req.user.refreshToken}`
      );
    }
  );

  app.get("/user/username", isAuth(), async (req: any, res) => {
    res.send(
      await getConnection().query(
        `select u."username" from "user" u where u."id" = '${req.userId}';`
      )
    );
  });

  app.get("/user/text-stories/:cursor?", isAuth(), async (req: any, res) => {
    let cursor = 0;
    if (req.params.cursor) {
      const nCursor = parseInt(req.params.cursor);
      if (!Number.isNaN(nCursor)) {
        cursor = nCursor;
      }
    }
    const limit = 10;

    const stories = await fetchUserStories(limit, cursor, req.userId);

    const data = {
      stories: stories.slice(0, limit),
      hasMore: stories.length === limit + 1,
    };
    res.json(data);
  });

  app.get("/user/ban/:username", isBot(), async (req: any, res, next) => {
    const { username } = req.params;

    let user: User | undefined = await User.findOne({ username: username });

    if (typeof user === "undefined") {
      return next(createError(404, "Can't find specified user"));
    }

    try {
      await Banned.findOneOrFail({ userId: user?.id });

      res.status(204).send("User has already been banned");
      return;
    } catch (err) {
      await Banned.insert({ userId: user?.id, githubId: user?.githubId });
      await User.update(user.id, { isBanned: true });
    }

    res.status(200).send({ ok: true });
  });

  app.get("/user/delete-stories/:username", isBot(), async (req: any, res, next) => {
    const { username } = req.params;

    let user: User | undefined = await User.findOne({ username: username });

    if (typeof user === "undefined") {
      return next(createError(404, "Can't find specified user"));
    }

    try {
      await TextStory.delete({ creatorId: user.id });
      await GifStory.delete({ creatorId: user.id });
    } catch (err) {
      console.log(err);
    }

    res.status(200).send({ ok: true });
  });

  app.get("/text-stories/friends/hot/:cursor?/:friendIds?", isAuth(), async (req: any, res) => {
    let friendIds: Array<string> = req.params.friendIds ? req.params.friendIds.split(",") : [];

    if (friendIds.length === 0) {
      let user = await User.findOne({ id: req.userId });

      // Get the user objects the user (username) is following
      let result = await octokit.request("GET /users{/username}/following", {
        username: user?.username,
        headers: {
          accept: `application/vnd.github.v3+json`,
          authorization: `token ${user?.githubAccessToken}`,
        }
      });
      // Take the data array from the result, which is basically all the users in an array
      const { data } = result;
      if (data.length === 0) {
        const d = {
          stories: [],
          friendIds: [],
          hasMore: false,
        };
        res.json(d);
        return;
      }
      // Create a string of WHERE conditions
      let add = ``;
      for (var i = 0; i < data.length; i++) {
        if (i != 0) {
          add += ` OR `;
        }
        add += `u."githubId" LIKE '${data[i]?.id}'`;
      }
      // Create the query and add the WHERE conditions
      // Only return the ids of the users
      let query = `select u."id" from "user" u where ${add};`;
      // Execute query
      const arr = await getConnection().query(query);

      //let friendIds: Array<string> = [];
      // Loop through all the id objects and add them to a list,
      // in order to have a clear json structure for the frontend
      arr.forEach((userId: { id: any }) => {
        friendIds.push(userId?.id);
      });
    }

    if (friendIds.length === 0) {
      const d = {
        stories: [],
        friendIds: [],
        hasMore: false,
      };
      res.json(d);
      return;
    }

    // Perform request to get friends stories
    let cursor = 0;
    if (req.params.cursor) {
      const nCursor = parseInt(req.params.cursor);
      if (!Number.isNaN(nCursor)) {
        cursor = nCursor;
      }
    }
    const limit = 11;
    const stories = await fetchStories(limit, cursor, friendIds);

    const data = {
      stories: stories.slice(0, limit),
      friendIds: friendIds,
      hasMore: stories.length === limit + 1,
    };

    res.json(data);
  });
  if (process.env.LATENCY_ON === "true") {
    app.use(function (_req, _res, next) {
      setTimeout(next, Number(process.env.LATENCY_MS));
    });
  }

  app.get("/story/likes/:id", async (_req, _res, next) => {
    return next(createError(400, upgradeMessage));
  });

  app.get("/stories/hot/:cursor?", async (_, __, next) => {
    return next(createError(400, upgradeMessage));
  });

  app.get("/gif-story/:id", isAuth(false), async (req: any, res) => {
    const { id } = req.params;
    if (!id || !isUUID.v4(id)) {
      res.json({ story: null });
    } else {
      const replacements = [id];
      if (req.userId) {
        replacements.push(req.userId);
      }
      res.json({
        story: (
          await getConnection().query(
            `
      select ts.*, l."gifStoryId" is not null "hasLiked" from gif_story ts
      left join "favorite" l on l."gifStoryId" = ts.id ${req.userId ? `and l."userId" = $2` : ""
            }
      where id = $1
      `,
            replacements
          )
        )[0],
      });
    }
  });
  app.get("/text-story/:id", isAuth(false), async (req: any, res) => {
    const { id } = req.params;
    if (!id || !isUUID.v4(id)) {
      res.json({ story: null });
    } else {
      const replacements = [id];
      if (req.userId) {
        replacements.push(req.userId);
      }
      res.json({
        story: (
          await getConnection().query(
            `
      select ts.*, l."textStoryId" is not null "hasLiked" from text_story ts
      left join "like" l on l."textStoryId" = ts.id ${req.userId ? `and l."userId" = $2` : ""
            }
      where id = $1
      `,
            replacements
          )
        )[0],
      });
    }
  });
  app.get("/is-friend/:username", isAuth(), async (req: any, res) => {
    const { username } = req.params;

    let found: boolean = false;
    try {
      let user = await User.findOne({ id: req.userId });

      let result = await octokit.request('GET /users{/username}/following', {
        username: user?.username,
        headers: {
          accept: `application/vnd.github.v3+json`,
          authorization: `token ${user?.githubAccessToken}`,
        }
      });

      const { data } = result;

      data.forEach((el: any) => {
        if (el.login === username) {
          found = true;
        }
      });
    } catch (err) {
      console.log(err);
    }

    if (found) {
      res.send({ ok: true });
    } else {
      res.send({ ok: false });
    }
  });
  app.get("/gif-stories/hot/:cursor?", async (req, res) => {
    let cursor = 0;
    if (req.params.cursor) {
      const nCursor = parseInt(req.params.cursor);
      if (!Number.isNaN(nCursor)) {
        cursor = nCursor;
      }
    }
    const limit = 21;
    const stories = await getConnection().query(`
      select
      ts.id,
      u.username "creatorUsername",
      u."photoUrl" "creatorAvatarUrl",
      u.flair
      from gif_story ts
      inner join "user" u on u.id = ts."creatorId"
      order by (ts."numLikes"+1) / power(EXTRACT(EPOCH FROM current_timestamp-ts."createdAt")/3600,1.8) DESC
      limit ${limit + 1}
      ${cursor ? `offset ${limit * cursor}` : ""}
    `);

    const data = {
      stories: stories.slice(0, limit),
      hasMore: stories.length === limit + 1,
    };
    res.json(data);
  });
  app.get("/text-stories/hot/:cursor?", isAuth(false), async (req: any, res) => {
    let cursor = 0;
    if (req.params.cursor) {
      const nCursor = parseInt(req.params.cursor);
      if (!Number.isNaN(nCursor)) {
        cursor = nCursor;
      }
    }
    const limit = 21;

    const stories = await fetchStories(limit, cursor);

    const data = {
      stories: stories.slice(0, limit),
      hasMore: stories.length === limit + 1,
    };
    res.json(data);
  });

  app.post("/delete-gif-story/:id", isAuth(), async (req: any, res) => {
    const { id } = req.params;
    if (!isUUID.v4(id)) {
      res.send({ ok: false });
      return;
    }

    const criteria: Partial<GifStory> = { id };

    if (req.userId !== "dac7eb0f-808b-4842-b193-5d68cc082609") {
      criteria.creatorId = req.userId;
    }

    await GifStory.delete(criteria);
    res.send({ ok: true });
  });

  app.post("/delete-text-story/:id", isAuth(), async (req: any, res) => {
    const { id } = req.params;
    if (!isUUID.v4(id)) {
      res.send({ ok: false });
      return;
    }

    const criteria: Partial<TextStory> = { id };

    if (req.userId !== "dac7eb0f-808b-4842-b193-5d68cc082609") {
      criteria.creatorId = req.userId;
    }

    await TextStory.delete(criteria);
    res.send({ ok: true });
  });

  app.post("/remove-friend/:username", isAuth(), async (req: any, res, next) => {
    const { username } = req.params;

    try {
      let user = await User.findOne({ id: req.userId });

      await octokit.request(`DELETE /user/following{/username}`, {
        username: username,
        headers: {
          accept: `application/vnd.github.v3+json`,
          authorization: `token ${user?.githubAccessToken}`,
        }
      });
    } catch (err) {
      console.log(err);
      if (err.status === 404) {
        return next(createError(404, "You probably need to reauthenticate in order to follow people"));
      }
      return next(createError(400, "There's no such user"));
    }

    res.send({ ok: true });
  });
  app.post("/add-friend/:username", isAuth(), async (req: any, res, next) => {
    const { username } = req.params;

    try {
      let user = await User.findOne({ id: req.userId });

      await octokit.request(`PUT /user/following{/username}`, {
        username: username,
        headers: {
          accept: `application/vnd.github.v3+json`,
          authorization: `token ${user?.githubAccessToken}`,
        }
      });
    } catch (err) {
      console.log(err);
      if (err.status === 404) {
        return next(createError(404, "You probably need to reauthenticate in order to follow people"));
      }
      return next(createError(400, "There's no such user"));
    }

    res.send({ ok: true });
  });

  app.post("/unlike-text-story/:id", isAuth(), async (req: any, res, next) => {
    const { id } = req.params;
    if (!isUUID.v4(id)) {
      res.send({ ok: false });
      return;
    }
    try {
      const currentLike = await Like.find({
        textStoryId: id,
        userId: req.userId,
      });
      if (currentLike.length !== 1) return;
      const { affected } = await Like.delete({
        textStoryId: id,
        userId: req.userId,
      });
      if (affected) {
        await TextStory.update(id, { numLikes: () => '"numLikes" - 1' });
      }
    } catch (err) {
      console.log(err);
      return next(createError(400, "You probably already liked this"));
    }

    res.send({ ok: true });
  });
  app.post("/like-text-story/:id", isAuth(), async (req: any, res, next) => {
    const { id } = req.params;
    if (!isUUID.v4(id)) {
      res.send({ ok: false });
      return;
    }
    try {
      const currentLike = await Like.find({
        textStoryId: id,
        userId: req.userId,
      });
      if (currentLike.length !== 0) return;
      await Like.insert({ textStoryId: id, userId: req.userId });
    } catch (err) {
      console.log(err);
      return next(createError(400, "You probably already liked this"));
    }

    await TextStory.update(id, { numLikes: () => '"numLikes" + 1' });

    res.send({ ok: true });
  });
  app.post("/like-gif-story/:id", isAuth(), async (req: any, res, next) => {
    const { id } = req.params;
    if (!isUUID.v4(id)) {
      res.send({ ok: false });
      return;
    }
    try {
      await Favorite.insert({ gifStoryId: id, userId: req.userId });
    } catch (err) {
      console.log(err);
      return next(createError(400, "You probably already liked this"));
    }

    await GifStory.update(id, { numLikes: () => '"numLikes" + 1' });

    res.send({ ok: true });
  });

  app.post("/like-story/:id/:username", async (_req, _res, next) => {
    return next(createError(400, upgradeMessage));
  });
  const maxTextLength = 20000;
  app.post(
    "/new-text-story",
    isAuth(),
    rateLimit({
      keyGenerator: (req: any) => req.userId,
      windowMs: 43200000, // 12 hours
      message: "Limit reached. You can only post 10 stories a day.",
      max: 10,
      headers: false,
    }),
    async (req, res) => {
      let { text, programmingLanguageId, filename, recordingSteps } = req.body;
      if (text.length > maxTextLength) {
        text = text.slice(0, maxTextLength);
      }
      if (programmingLanguageId.length > 40) {
        programmingLanguageId = null;
      }
      if (filename.length > 100) {
        filename = "untitled";
      }
      const ts = await TextStory.create({
        text,
        filename,
        recordingSteps,
        programmingLanguageId,
        creatorId: (req as any).userId,
      }).save();
      const currentUser = await User.findOneOrFail((req as any).userId);

      res.send({
        id: ts.id,
        creatorUsername: currentUser.username,
        creatorAvatarUrl: currentUser.photoUrl,
        flair: currentUser.flair,
      });
    }
  );

  app.post(
    "/new-gif-story",
    isAuth(),
    rateLimit({
      keyGenerator: (req: any) => req.userId,
      windowMs: 43200000, // 12 hours
      message: "Limit reached. You can only post 10 stories a day.",
      max: 10,
      headers: false,
    }),
    async (req, res, next) => {
      let { token, programmingLanguageId } = req.body;
      if (programmingLanguageId.length > 40) {
        programmingLanguageId = null;
      }
      let filename: string = "";
      let flagged = null;
      try {
        const payload: any = jwt.verify(token, process.env.TOKEN_SECRET);
        filename = payload.filename;
        flagged = payload.flagged;
      } catch (err) {
        console.log("tokenErr: ", err);
        return next(createError(400, "something went wrong uploading gif"));
      }
      if (!filename) {
        return next(
          createError(400, "something went really wrong uploading gif")
        );
      }
      // @todo if flagged ping me on slack
      const gs = await GifStory.create({
        mediaId: filename,
        flagged,
        programmingLanguageId,
        creatorId: (req as any).userId,
      }).save();
      const currentUser = await User.findOneOrFail((req as any).userId);

      res.send({
        id: gs.id,
        creatorUsername: currentUser.username,
        mediaId: filename,
        creatorAvatarUrl: currentUser.photoUrl,
        flair: currentUser.flair,
      });
    }
  );

  app.post("/new-story", async (_req, _res, next) => {
    return next(createError(400, upgradeMessage));
  });

  app.post("/update-flair", isAuth(), async (req, res) => {
    if (
      !req.body.flair ||
      typeof req.body.flair !== "string" ||
      req.body.flair.length > 40
    ) {
      res.json({ ok: false });
      return;
    }
    await User.update({ id: (req as any).userId }, { flair: req.body.flair });
    res.json({ ok: true });
  });

  app.use((err: any, _: any, res: any, next: any) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err.statusCode) {
      res.status(err.statusCode).send(err.message);
    } else {
      console.log(err);
      res.status(500).send("internal server error");
    }
  });

  app.listen(process.env.PORT || 8080, () => {
    console.log("server started");
  });
};

main();
