import { RequestHandler } from "express";
import createError from "http-errors";

export const isBot: (st?: boolean) => RequestHandler<{}, any, any, {}> = (
  shouldThrow = true
) => async (req, _res, next) => {
  const accessToken = req.headers["bot-access-token"];
  if (!accessToken || typeof accessToken !== "string" || accessToken !== process.env.BOT_TOKEN) {
    return next(
      !shouldThrow ? undefined : createError(401, "You don't have enough permissions")
    );
  }

  next();
};
