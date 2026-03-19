import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: function DefaultTextarea() {
    const [value, setValue] = useState('');
    return (
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter description..."
        rows={4}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    value: 'Disabled textarea content',
    disabled: true,
    rows: 4,
  },
};
