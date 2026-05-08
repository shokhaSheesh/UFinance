'use client';

import { usePageSearch } from '@/hooks/usePageSearch';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function PageSearchBar({
  contentRef,
  placeholder = 'Qidirish...',
  className = '',
  enableHotkey = true,
}) {
  const inputRef = useRef(null);
  const { query, setQuery, total, current, next, prev, clear } =
    usePageSearch(contentRef);

  // Ctrl+F (Windows/Linux) yoki Cmd+F (Mac) — browser default qidiruvini
  // bekor qilib, bizning inputga fokus beramiz
  useEffect(() => {
    if (!enableHotkey) return;
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableHotkey]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.shiftKey ? prev() : next();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clear();
      inputRef.current?.blur();
    }
  };

  const noMatch = query.length > 0 && total === 0;

  return (
    <div
      data-page-search-bar
      className={`flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 shadow-xs ${className}`}
    >
      <Search size={14} className="shrink-0 text-gray-400" />

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="w-44 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
      />

      <span
        className={`min-w-[36px] text-center text-xs tabular-nums ${noMatch ? 'text-red-500' : 'text-gray-500'
          }`}
      >
        {query ? `${current}/${total}` : ''}
      </span>

      <button
        type="button"
        onClick={prev}
        disabled={total === 0}
        title="Oldingisi (Shift+Enter)"
        aria-label="Oldingi moslik"
        className="rounded p-1 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronUp size={14} />
      </button>

      <button
        type="button"
        onClick={next}
        disabled={total === 0}
        title="Keyingisi (Enter)"
        aria-label="Keyingi moslik"
        className="rounded p-1 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronDown size={14} />
      </button>

      {query && (
        <button
          type="button"
          onClick={() => {
            clear();
            inputRef.current?.focus();
          }}
          title="Tozalash (Esc)"
          aria-label="Qidiruvni tozalash"
          className="rounded p-1 text-gray-500 transition hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}