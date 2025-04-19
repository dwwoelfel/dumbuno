// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from '@instantdb/react';
import { type Game } from '@lib/game';

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.any(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    games: i
      .entity({
        players: i.any(),
        playerHands: i.any(),
        activePlayerIdx: i.number(),
        currentColor: i.string(),
        discard: i.any(),
        drawPile: i.any(),
        reverseDirection: i.boolean(),
        nextActions: i.any(),
      })
      .asType<Game>(),
  },
  links: {},
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
