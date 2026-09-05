import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Spinner } from '@/shared/components/Spinner';

const meta = {
  title: '共通UI/Spinner',
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component:
          '回転そのものは装飾なので aria-hidden にしている。読み込み中であることは呼び出し側がテキストで伝える。prefers-reduced-motion が有効な環境では回転しない。',
      },
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
