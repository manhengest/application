import type { Meta, StoryObj } from '@storybook/react';
import { EventTagChip } from './EventTagChip';
import type { EventTag } from '../types';

const meta: Meta<typeof EventTagChip> = {
  component: EventTagChip,
  tags: ['autodocs'],
};

export default meta;

const sampleTag: EventTag = { id: '1', name: 'Tech' };

type Story = StoryObj<typeof EventTagChip>;

export const Default: Story = {
  args: {
    tag: sampleTag,
  },
};

export const Compact: Story = {
  args: {
    tag: sampleTag,
    compact: true,
  },
};

export const MultipleTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <EventTagChip tag={{ id: '1', name: 'Tech' }} />
      <EventTagChip tag={{ id: '2', name: 'Art' }} />
      <EventTagChip tag={{ id: '3', name: 'Business' }} compact />
      <EventTagChip tag={{ id: '4', name: 'Music' }} compact />
    </div>
  ),
};
