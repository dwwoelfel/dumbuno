export const instantAppId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

if (instantAppId == null) {
  throw Error('Missing NEXT_PUBLIC_INSTANT_APP_ID env var');
}

const config = { instantAppId };

export default config;
