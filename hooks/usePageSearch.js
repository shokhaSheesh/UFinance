'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sahifa ichida text qidirish uchun hook (Ctrl+F kabi).
 *
 * @param {React.RefObject<HTMLElement|null>} rootRef - qidirish kerak bo'lgan
 *        kontentni o'rab turgan element ref'i. Agar null bo'lsa,
 *        document.body bo'yicha qidiriladi.
 * @param {{ debounceMs?: number }} [options]
 *
 * @returns {{
 *   query: string,
 *   setQuery: (q: string) => void,
 *   total: number,
 *   current: number,
 *   next: () => void,
 *   prev: () => void,
 *   clear: () => void,
 *   refresh: () => void
 * }}
 *
 * Foydalanish:
 *   const contentRef = useRef(null);
 *   const { query, setQuery, total, current, next, prev, clear, refresh } =
 *     usePageSearch(contentRef);
 */

const HIGHLIGHT_CLASS = 'page-search-highlight';
const CURRENT_CLASS = 'page-search-current';

// ─── Yordamchi funksiyalar ──────────────────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clearHighlights(root) {
  const marks = root.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`);
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
    parent.normalize();
  });
}

function collectTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentNode;
      if (!parent) return NodeFilter.FILTER_REJECT;

      const tag = parent.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
        return NodeFilter.FILTER_REJECT;
      }
      // Qidiruv panelining o'zini qidirmaymiz
      if (parent.closest && parent.closest('[data-page-search-bar]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

function highlightInRoot(root, query) {
  const regex = new RegExp(escapeRegex(query), 'gi');
  const marks = [];

  collectTextNodes(root).forEach((textNode) => {
    const text = textNode.nodeValue;
    regex.lastIndex = 0;
    if (!regex.test(text)) return;
    regex.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0;
    let m;

    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      const mark = document.createElement('mark');
      mark.className = HIGHLIGHT_CLASS;
      mark.textContent = m[0];
      frag.appendChild(mark);
      marks.push(mark);
      last = m.index + m[0].length;

      // bo'sh moslik (zero-width) holatida cheksiz tsikldan saqlanish
      if (m.index === regex.lastIndex) regex.lastIndex++;
    }
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(frag, textNode);
    }
  });

  return marks;
}

// ─── Hook'ning o'zi ──────────────────────────────────────────────────────

export function usePageSearch(rootRef, options) {
  const [query, setQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(-1); // 0-based
  const matchesRef = useRef([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const debounceMs = (options && options.debounceMs) ?? 150;

  const focusIndex = useCallback((idx) => {
    matchesRef.current.forEach((m) => m.classList.remove(CURRENT_CLASS));
    const target = matchesRef.current[idx];
    if (!target) return;
    target.classList.add(CURRENT_CLASS);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Query yoki refresh o'zgarganda highlight'ni qayta hisoblaymiz
  useEffect(() => {
    const root = (rootRef && rootRef.current) || document.body;
    if (!root) return;

    const timer = setTimeout(() => {
      clearHighlights(root);
      matchesRef.current = [];

      if (!query.trim()) {
        setTotal(0);
        setCurrentIdx(-1);
        return;
      }

      const marks = highlightInRoot(root, query);
      matchesRef.current = marks;
      setTotal(marks.length);

      if (marks.length > 0) {
        setCurrentIdx(0);
        marks[0].classList.add(CURRENT_CLASS);
        marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setCurrentIdx(-1);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      // unmount yoki query o'zgarishidan oldin DOM'ni tozalash
      if (root) clearHighlights(root);
      matchesRef.current = [];
    };
  }, [query, refreshTick, rootRef, debounceMs]);

  const next = useCallback(() => {
    const len = matchesRef.current.length;
    if (!len) return;
    setCurrentIdx((prev) => {
      const newIdx = (prev + 1) % len;
      focusIndex(newIdx);
      return newIdx;
    });
  }, [focusIndex]);

  const prev = useCallback(() => {
    const len = matchesRef.current.length;
    if (!len) return;
    setCurrentIdx((p) => {
      const newIdx = (p - 1 + len) % len;
      focusIndex(newIdx);
      return newIdx;
    });
  }, [focusIndex]);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  return {
    query,
    setQuery,
    total,
    current: currentIdx >= 0 ? currentIdx + 1 : 0,
    next,
    prev,
    clear,
    refresh,
  };
}