import '@mantine/core/styles.css';

import React from 'react';
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from '@mantine/core';
import { theme } from '../theme';

export const metadata = {
  title: 'Dumbuno',
  description: 'Play Dumbuno',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <style>
          {
            /* css */ `
            html {
              height: 100%;
              overflow: hidden;
            }
            body{
              margin: 0;
              overflow: hidden;
              height: 100%;
              position: relative;
            }`
          }
        </style>
      </head>
      <body>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </body>
    </html>
  );
}
