import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ConfirmModal } from './ConfirmModal';

const meta: Meta<typeof ConfirmModal> = {
  component: ConfirmModal,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ConfirmModal>;

function ConfirmModalWrapper({ open: initialOpen }: { open: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Open Modal
      </button>
      <ConfirmModal
        open={open}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

export const Closed: Story = {
  render: () => <ConfirmModalWrapper open={false} />,
};

export const Open: Story = {
  render: () => (
    <ConfirmModal
      open
      title="Delete Event"
      message="Are you sure you want to delete this event? This action cannot be undone."
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  ),
};
