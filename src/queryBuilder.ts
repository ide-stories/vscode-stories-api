import { getConnection } from "typeorm";

export async function fetchStories(
    limit: number,
    cursor: number,
    friendIds?: string[]
) {
    const queryString = `
      select
      ts.id,
      ts."creatorId",
      u.username "creatorUsername",
      u."id" "creatorId",
      u."photoUrl" "creatorAvatarUrl",
      u.flair
      from text_story ts
      inner join "user" u on u.id = ts."creatorId"
      ${friendIds ? `WHERE u."id" IN ('${friendIds.join("', '")}')` : ``}
      order by (ts."numLikes"+1) / power(EXTRACT(EPOCH FROM current_timestamp-ts."createdAt")/3600,1.8) DESC
      limit ${limit + 1}
      ${cursor ? `offset ${limit * cursor}` : ""}
    `;
    
    const stories = await getConnection().query(queryString);

    return stories;
}