import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],

  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],

  staticDirs: ['../public'],

  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
