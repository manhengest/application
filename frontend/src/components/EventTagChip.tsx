import type { EventTag } from '../types';

interface EventTagChipProps {
  tag: EventTag;
  compact?: boolean;
}

export function EventTagChip({ tag, compact }: EventTagChipProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 ${
        compact ? '' : 'px-2.5 py-1 text-sm'
      }`}
    >
      {tag.name}
    </span>
  );
}
