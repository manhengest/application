import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FormField } from './FormField';
import { Input } from './Input';
import { Textarea } from './Textarea';

const meta: Meta<typeof FormField> = {
  component: FormField,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof FormField>;

export const WithInput: Story = {
  render: function WithInputStory() {
    const [value, setValue] = useState('');
    return (
      <FormField label="Email">
        <Input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="email@example.com"
        />
      </FormField>
    );
  },
};

export const WithTextarea: Story = {
  render: function WithTextareaStory() {
    const [value, setValue] = useState('');
    return (
      <FormField label="Description">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe..."
          rows={4}
        />
      </FormField>
    );
  },
};

export const Required: Story = {
  render: function RequiredStory() {
    const [value, setValue] = useState('');
    return (
      <FormField label="Event Title" required>
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g., Tech Conference 2025"
        />
      </FormField>
    );
  },
};

export const WithHint: Story = {
  render: function WithHintStory() {
    const [value, setValue] = useState('');
    return (
      <FormField label="Capacity" hint="Maximum number of participants. Leave empty for unlimited.">
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Leave empty for unlimited"
        />
      </FormField>
    );
  },
};
