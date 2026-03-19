import type { Meta, StoryObj } from '@storybook/react';
import { ErrorAlert } from './ErrorAlert';

const meta: Meta<typeof ErrorAlert> = {
  component: ErrorAlert,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ErrorAlert>;

export const Default: Story = {
  args: {
    message: 'Invalid credentials. Please try again.',
  },
};
