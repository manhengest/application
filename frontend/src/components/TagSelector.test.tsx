import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagSelector } from './TagSelector';

describe('TagSelector', () => {
  it('renders selected tags as chips', () => {
    render(
      <TagSelector
        selected={['Tech', 'Art']}
        options={[]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('Art')).toBeInTheDocument();
  });

  it('calls onChange when removing a tag', () => {
    const onChange = vi.fn();
    render(
      <TagSelector
        selected={['Tech']}
        options={[]}
        onChange={onChange}
      />,
    );
    const removeBtn = screen.getByLabelText('Remove Tech');
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows placeholder when no tags selected', () => {
    render(
      <TagSelector
        selected={[]}
        options={[{ id: '1', name: 'Tech' }]}
        onChange={vi.fn()}
        placeholder="Add tags..."
      />,
    );
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  it('calls onChange when adding tag from options', async () => {
    const onChange = vi.fn();
    render(
      <TagSelector
        selected={[]}
        options={[{ id: '1', name: 'Tech' }, { id: '2', name: 'Art' }]}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    const techOption = await screen.findByRole('option', { name: 'Tech' });
    fireEvent.mouseDown(techOption);
    expect(onChange).toHaveBeenCalledWith(['Tech']);
  });

  it('does not add tag when at maxTags limit', () => {
    const onChange = vi.fn();
    render(
      <TagSelector
        selected={['A', 'B', 'C', 'D', 'E']}
        options={[{ id: '6', name: 'F' }]}
        onChange={onChange}
        maxTags={5}
      />,
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes dropdown on Escape key', async () => {
    render(
      <TagSelector
        selected={[]}
        options={[{ id: '1', name: 'Tech' }]}
        onChange={vi.fn()}
      />,
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
