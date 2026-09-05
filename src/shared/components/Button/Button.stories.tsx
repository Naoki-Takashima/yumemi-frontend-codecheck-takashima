import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from '@/shared/components/Button';

const meta = {
  title: '共通UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'form の中に置いても意図せず送信されないよう、type の既定値を button にしている。',
      },
    },
  },
  args: {
    children: 'ボタン',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['outline', 'primary'],
      description: 'outline は補助的な操作、primary は主要な操作に使う',
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 「すべて解除」など、補助的な操作に使う既定の見た目。 */
export const Outline: Story = {
  args: { variant: 'outline' },
};

/** 「再試行」など、主要な操作に使う。 */
export const Primary: Story = {
  args: { variant: 'primary' },
};

/** 押せない状態。選択が 0 件のときの「すべて解除」など。 */
export const Disabled: Story = {
  args: { variant: 'outline', disabled: true },
};

/** 2 つの見た目を並べて比較する。 */
export const AllVariants: Story = {
  name: '一覧',
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="outline">outline</Button>
      <Button variant="primary">primary</Button>
      <Button variant="outline" disabled>
        outline / disabled
      </Button>
      <Button variant="primary" disabled>
        primary / disabled
      </Button>
    </div>
  ),
};
