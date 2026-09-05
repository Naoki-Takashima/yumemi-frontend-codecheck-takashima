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
      options: ['outline', 'primary', 'link'],
      description:
        'outline は補助的な操作、primary は主要な操作、link は囲みを出したくない弱い操作に使う',
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

export const Link: Story = {
  args: { variant: 'link', children: 'すべて解除' },
};

/** 押せない状態。選択が 0 件のときの「すべて解除」など。 */
export const Disabled: Story = {
  args: { variant: 'outline', disabled: true },
};

/** 3 つの見た目を並べて比較する。 */
export const AllVariants: Story = {
  name: '一覧',
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="outline">outline</Button>
      <Button variant="primary">primary</Button>
      <Button variant="link">link</Button>
      <Button variant="outline" disabled>
        outline / disabled
      </Button>
      <Button variant="primary" disabled>
        primary / disabled
      </Button>
      <Button variant="link" disabled>
        link / disabled
      </Button>
    </div>
  ),
};
