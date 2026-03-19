import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  component: Card,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Card Title</h2>
        <p className="text-gray-600">
          This is a card component with rounded corners and a border. Use it to group related content.
        </p>
      </>
    ),
  },
};
