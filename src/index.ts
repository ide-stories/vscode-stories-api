require("dotenv-safe").config();
import "reflect-metadata";
import jwt from "jsonwebtoken";
import cors from "@koa/cors";
import ratelimit from "koa-ratelimit";
import Router from "@koa/router";
import createError from "http-errors";
import isUrl from "is-url";
import isUUID from "is-uuid";
import helmet from "koa-helmet";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { createConnection, getConnection } from "typeorm";
import { __prod__ } from "./constants";
import { Story } from "./entities/Story";
import { Initial1603926831459 } from "./migrations/1603926831459-Initial";
import { Unique1604009152019 } from "./migrations/1604009152019-Unique";
import cache from "memory-cache";
import LRU from "lru-cache";

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
    entities: [Story],
    migrations: [Initial1603926831459, Unique1604009152019],
    // synchronize: !__prod__,
    logging: !__prod__,
    ...prodCredentials,
  });
  console.log("connected, running migrations now");
  await conn.runMigrations();
  console.log("migrations ran");

  const app = new Koa();
  app.use(helmet());
  app.use(cors({ origin: "*", maxAge: 86400 }));
  app.use(bodyParser());
  const router = new Router();

  const likeCache = new LRU<string, number>(200);
  router.get("/story/likes/:id", async (ctx) => {
    if (!isUUID.v4(ctx.params.id)) {
      ctx.body = { likes: 0 };
      return;
    }
    if (!likeCache.has(ctx.params.id)) {
      likeCache.set(
        ctx.params.id,
        (await Story.findOne(ctx.params.id, { select: ["numLikes"] }))
          ?.numLikes || 0
      );
    }

    ctx.body = { likes: likeCache.get(ctx.params.id) };
  });

  router.get("/stories/hot/:cursor?", async (ctx) => {
    let cursor = 0;
    if (ctx.params.cursor) {
      const nCursor = parseInt(ctx.params.cursor);
      if (!Number.isNaN(nCursor)) {
        cursor = nCursor;
      }
    }
    const v = cache.get("" + cursor);
    if (v) {
      ctx.body = v;
      return;
    }
    const limit = 20;
    const qb = getConnection()
      .createQueryBuilder(Story, "s")
      .orderBy(
        '("numLikes"+1) / power(EXTRACT(EPOCH FROM current_timestamp-"createdAt")/3600,1.8)',
        "DESC"
      )
      .take(limit + 1);

    if (cursor) {
      qb.skip(limit * cursor);
    }

    const stories = await qb.getMany();
    const data = {
      stories: stories.slice(0, limit),
      hasMore: stories.length === limit + 1,
    };
    cache.put("" + cursor, data, 60000); // 1 minute
    ctx.body = data;
  });

  const lru = new LRU<string, string[]>(5000);
  const db = new Map();
  router.post(
    "/like-story/:id/:username",
    ratelimit({
      driver: "memory",
      db: db,
      id: (ctx) => ctx.request.headers["x-forwarded-for"] || ctx.ip,
      duration: 43200000, // 12 hours
      errorMessage: "Limit reached. You can only like 30 stories in 1 day.",
      max: 30,
      disableHeader: true,
    }),
    async (ctx) => {
      if (ctx.params.id && isUUID.v4(ctx.params.id) && ctx.params.username) {
        const ips = lru.get(ctx.params.username) || [];
        if (ips.length > 5) {
          ctx.body = { ok: true };
          return;
        }
        const ip = ctx.request.headers["x-forwarded-for"] || ctx.ip;
        if (!ips.includes(ip)) {
          lru.set(ctx.params.username, [ip, ...ips]);
        }
        await Story.update(ctx.params.id, { numLikes: () => '"numLikes" + 1' });
        likeCache.del(ctx.params.id);
        ctx.body = { ok: true };
      } else {
        ctx.body = { ok: false };
      }
    }
  );

  router.post("/new-story", async (ctx) => {
    let { token, creatorUsername, creatorAvatarUrl, flair } = ctx.request.body;
    if (!creatorUsername || typeof creatorUsername !== "string") {
      throw createError(422, "you need to set a username in VSCode settings");
    }
    if (
      !creatorAvatarUrl ||
      typeof creatorAvatarUrl !== "string" ||
      !isUrl(creatorAvatarUrl) ||
      !creatorAvatarUrl.startsWith("https://avatars2.githubusercontent.com")
    ) {
      creatorAvatarUrl = "";
    }

    if (!token || typeof token !== "string") {
      throw createError(422, "bad video, contact ben");
    }

    let mediaId = "";
    try {
      const payload: any = jwt.verify(token, process.env.TOKEN_SECRET);
      if ("filename" in payload) {
        mediaId = payload.filename;
      }
    } catch {}
    if (!mediaId) {
      throw createError(422, "bad video, contact ben");
    }

    if (
      typeof flair !== "string" ||
      ![
        "vanilla js",
        "flutter",
        "react",
        "vue",
        "angular",
        "python",
        "dart",
        "java",
        "cpp",
        "kotlin",
        "go",
      ].includes(flair)
    ) {
      flair = "vanilla js";
    }

    const cleanedUrl: string = creatorAvatarUrl.replace(
      /[^-A-Za-z0-9+&@#/%?=~_|!:,.;\(\)]/g,
      ""
    );

    const username = creatorUsername
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 10)
      .toLowerCase();

    const data = {
      flair,
      mediaId,
      creatorUsername: !username.length ? "nonamemurphy" : username,
      creatorAvatarUrl:
        !isUrl(cleanedUrl) || !cleanedUrl.startsWith("https://")
          ? ""
          : cleanedUrl,
    };

    const {
      raw: [otherValues],
    } = await Story.insert(data);

    ctx.body = {
      ...data,
      ...otherValues,
    };
  });

  app.use(router.routes()).use(router.allowedMethods());

  console.log("app about to start");
  app.listen(8080);
};

main();
