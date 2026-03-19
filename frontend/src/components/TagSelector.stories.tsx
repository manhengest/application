import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TagSelector } from './TagSelector';

const meta: Meta<typeof TagSelector> = {
  component: TagSelector,
  tags: ['autodocs'],
};

export default meta;

const sampleOptions = [
  { id: '1', name: 'Tech' },
  { id: '2', name: 'Art' },
  { id: '3', name: 'Business' },
  { id: '4', name: 'Music' },
  { id: '5', name: 'Sports' },
  { id: '6', name: 'Education' },
];

type Story = StoryObj<typeof TagSelector>;

export const Empty: Story = {
  render: function EmptyTagSelector() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <TagSelector
        selected={selected}
        options={sampleOptions}
        onChange={setSelected}
        placeholder="Add tags..."
      />
    );
  },
};

export const WithTags: Story = {
  render: function WithTagsStory() {
    const [selected, setSelected] = useState<string[]>(['Tech', 'Art']);
    return (
      <TagSelector
        selected={selected}
        options={sampleOptions}
        onChange={setSelected}
        placeholder="Add tags..."
      />
    );
  },
};

export const WithOptions: Story = {
  render: function WithOptionsStory() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <div className="max-w-md">
        <TagSelector
          selected={selected}
          options={sampleOptions}
          onChange={setSelected}
          maxTags={5}
          placeholder="e.g., Tech, Art, Business"
        />
      </div>
    );
  },
};
