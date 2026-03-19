import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  component: Input,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Text: Story = {
  render: function TextInput() {
    const [value, setValue] = useState('');
    return (
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter text..."
      />
    );
  },
};

export const Email: Story = {
  render: function EmailInput() {
    const [value, setValue] = useState('');
    return (
      <Input
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="email@example.com"
      />
    );
  },
};

export const Password: Story = {
  render: function PasswordInput() {
    const [value, setValue] = useState('');
    return (
      <Input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter password"
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    value: 'Disabled input',
    disabled: true,
  },
};
