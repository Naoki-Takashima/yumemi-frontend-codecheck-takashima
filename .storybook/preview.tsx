import { definePreview } from '@storybook/nextjs-vite';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import addonMsw from 'msw-storybook-addon';
import 'msw-storybook-addon/types';

import { withQueryClient } from './decorators';

import '../src/app/globals.css';

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonMsw()],
  decorators: [withQueryClient],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        app: { name: 'アプリの背景', value: '#fff' },
        surface: { name: 'サーフェス', value: '#f6f7f9' },
      },
    },
  },

  initialGlobals: {
    backgrounds: { value: 'app' },
    a11y: { manual: false },
  },
});
