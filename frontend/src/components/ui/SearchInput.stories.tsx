import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SearchInput } from './SearchInput';

const meta: Meta<typeof SearchInput> = {
  component: SearchInput,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {
  render: function DefaultSearch() {
    const [value, setValue] = useState('');
    return (
      <SearchInput value={value} onChange={setValue} placeholder="Search events..." />
    );
  },
};

export const WithValue: Story = {
  render: function WithValueSearch() {
    const [value, setValue] = useState('Tech Conference');
    return (
      <SearchInput value={value} onChange={setValue} placeholder="Search events..." />
    );
  },
};
