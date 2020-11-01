require("dotenv-safe").config();
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import createError from "http-errors";
import isUUID from "is-uuid";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github";
import { join } from "path";
import "reflect-metadata";
import { createConnection, getConnection } from "typeorm";
import { __prod__ } from "./constants";
import { createTokens } from "./createTokens";
import { TextStory } from "./entities/TextStory";
import { User } from "./entities/User";
import { isAuth } from "./isAuth";

const upgradeMessage =
  "Upgrade the VSCode Stories extension, I fixed it and changed the API.";

const main = async () => {
  const prodCredentials = __prod__
    ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
    : {};
  console.log("about to connect to db, host: ", process.env.DB_HOST);

  const conn = await createConnection({
    type: "postgres",
    database: "stories",
    entities: [join(__dirname, "./entities/*")],
    migrations: [join(__dirname, "./migrations/*")],
    // synchronize: !__prod__,
    logging: !__prod__,
    ...prodCredentials,
  });
  console.log("connected, running migrations now");
  await conn.runMigrations();
  console.log("migrations ran");

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
      },
      async (githubAccessToken, _, profile, cb) => {
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

  app.get("/story/likes/:id", async (_req, _res, next) => {
    return next(createError(400, upgradeMessage));
  });

  app.get("/stories/hot/:cursor?", async (_, __, next) => {
    return next(createError(400, upgradeMessage));
  });

  app.get("/text-story/:id", async (req, res) => {
    const { id } = req.params;
    if (!id || !isUUID.v4(id)) {
      res.json({ story: null });
    } else {
      res.json({ story: await TextStory.findOne(id) });
    }
  });
  app.get("/text-stories/hot/:cursor?", async (req, res) => {
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
      from text_story ts
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

  app.post("/like-story/:id/:username", async (_req, _res, next) => {
    return next(createError(400, upgradeMessage));
  });
  const maxTextLength = 20000;
  app.post(
    "/new-text-story",
    isAuth,
    rateLimit({
      keyGenerator: (req: any) => req.userId,
      windowMs: 43200000, // 12 hours
      message: "Limit reached. You can only post 10 stories a day.",
      max: 10,
      headers: false,
    }),
    async (req, res) => {
      let { text, programmingLanguageId, filename } = req.body;
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

  app.post("/new-story", async (_req, _res, next) => {
    return next(createError(400, upgradeMessage));
  });

  app.post("/update-flair", isAuth, async (req, res) => {
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

  app.listen(8080, () => {
    console.log("server started");
  });
};

main();
