import { useState, useRef, useCallback } from 'react';

interface TagOption {
  id: string;
  name: string;
}

interface TagSelectorProps {
  selected: string[];
  options: TagOption[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
}

function normalizeForCompare(s: string): string {
  return s.trim().toLowerCase();
}

const LISTBOX_ID = 'tag-selector-listbox';

export function TagSelector({
  selected,
  options,
  onChange,
  maxTags = 5,
  placeholder = 'Add tags...',
  disabled,
}: TagSelectorProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const addTag = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const norm = normalizeForCompare(trimmed);
      const already = selected.some((s) => normalizeForCompare(s) === norm);
      if (already) return;
      if (selected.length >= maxTags) return;
      onChange([...selected, trimmed]);
      setInput('');
      setHighlightedIndex(-1);
    },
    [selected, maxTags, onChange],
  );

  const removeTag = (index: number) => {
    onChange(selected.filter((_, i) => i !== index));
  };

  const filteredOptions = options.filter(
    (o) =>
      !selected.some((s) => normalizeForCompare(s) === normalizeForCompare(o.name)) &&
      (input === '' || o.name.toLowerCase().includes(input.toLowerCase())),
  );

  const displayOptions = filteredOptions.slice(0, 10);
  const hasCreateOption =
    input.trim() &&
    !options.some((o) => normalizeForCompare(o.name) === normalizeForCompare(input)) &&
    !selected.some((s) => normalizeForCompare(s) === normalizeForCompare(input));
  const optionCount = displayOptions.length + (hasCreateOption ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFocused(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
      return;
    }
    if (optionCount > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setHighlightedIndex((prev) => Math.max(-1, Math.min(optionCount - 1, prev + delta)));
      return;
    }
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < displayOptions.length) {
        addTag(displayOptions[highlightedIndex].name);
      } else if (highlightedIndex === displayOptions.length && hasCreateOption) {
        addTag(input);
      } else if (input.trim()) {
        addTag(input);
      } else if (input === '' && selected.length > 0 && document.activeElement === inputRef.current) {
        removeTag(selected.length - 1);
      }
      return;
    }
    if (e.key === 'Backspace' && !input && selected.length > 0) {
      removeTag(selected.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`flex flex-wrap gap-2 items-center min-h-[42px] border rounded-lg px-3 py-2 bg-white ${
          focused ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-300'
        }`}
      >
        {selected.map((name, i) => (
          <span
            key={`${normalizeForCompare(name)}-${i}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
          >
            {name}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="ml-0.5 rounded-full hover:bg-indigo-200 p-0.5 leading-none"
                aria-label={`Remove ${name}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </span>
        ))}
        {selected.length < maxTags && (
          <div className="relative flex-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() =>
                setTimeout(() => {
                  setFocused(false);
                  setInput('');
                  setHighlightedIndex(-1);
                }, 150)
              }
              placeholder={selected.length === 0 ? placeholder : ''}
              disabled={disabled}
              className="w-full border-0 p-0 focus:ring-0 focus:outline-none text-sm placeholder-gray-400"
              list="tag-options"
              role="combobox"
              aria-expanded={focused && optionCount > 0}
              aria-haspopup="listbox"
              aria-controls={LISTBOX_ID}
              aria-activedescendant={
                highlightedIndex >= 0 ? `${LISTBOX_ID}-option-${highlightedIndex}` : undefined
              }
            />
            {focused && optionCount > 0 && (
              <ul
                ref={listRef}
                id={LISTBOX_ID}
                className="absolute z-10 mt-1 w-full max-h-40 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                role="listbox"
              >
                {displayOptions.map((opt, idx) => (
                  <li
                    key={opt.id}
                    id={`${LISTBOX_ID}-option-${idx}`}
                    role="option"
                    aria-selected={highlightedIndex === idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTag(opt.name);
                      inputRef.current?.focus();
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      highlightedIndex === idx ? 'bg-indigo-100 text-indigo-900' : 'text-gray-700 hover:bg-indigo-50'
                    }`}
                  >
                    {opt.name}
                  </li>
                ))}
                {hasCreateOption && (
                  <li
                    id={`${LISTBOX_ID}-option-${displayOptions.length}`}
                    role="option"
                    aria-selected={highlightedIndex === displayOptions.length}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTag(input);
                      inputRef.current?.focus();
                    }}
                    onMouseEnter={() => setHighlightedIndex(displayOptions.length)}
                    className={`px-3 py-2 text-sm cursor-pointer font-medium ${
                      highlightedIndex === displayOptions.length
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    + Create &quot;{input.trim()}&quot;
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Optional. Max {maxTags} tags. Type to add existing or create new. Press Enter to add a tag.
      </p>
    </div>
  );
}
