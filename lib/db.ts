import { init } from '@instantdb/react';
import config from '@lib/config';
import { AppSchema } from '@/instant.schema';

const db = init<AppSchema>({ appId: config.instantAppId });

export default db;
