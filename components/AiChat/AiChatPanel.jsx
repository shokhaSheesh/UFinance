"use client";

import useMounted from "@/hooks/useMounted";
import { useAiChat, sanitizeAiHtml } from "@/hooks/useAiChat";
import {
  AI_CHAT_MAX_FILES,
  AI_CHAT_MAX_FILE_SIZE,
  splitAiFileTokens,
  uploadAiChatFile,
} from "@/lib/api/ucode/aiChat";
import { showErrorNotification } from "@/lib/utils/notifications";
import { aiChatStore } from "@/store/aiChat.store";
import { appStore } from "@/store/app.store";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import styles from "./aiChat.module.scss";

const SparkIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ClipIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);

// ссылка на файл: inline — внутри текста (на месте {filename}), иначе — чип-строкой
const FileChip = ({ file, inline }) => (
  <a
    href={file.url}
    target="_blank"
    rel="noreferrer"
    className={inline ? styles.inlineFile : styles.msgFile}
    title={file.name}
    onClick={(e) => e.stopPropagation()}
  >
    <ClipIcon />
    <span>{file.name}</span>
  </a>
);

// Markdown-ссылка [label](http-url) — так хранятся файлы в истории (после подстановки).
// Разрешаем только http/https, чтобы не отрендерить опасный href.
const MD_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

// Рендерит текст, превращая markdown-ссылки на файлы в кликабельные ссылки.
const renderTextWithLinks = (text, keyBase) => {
  const s = String(text || "");
  const nodes = [];
  const re = new RegExp(MD_LINK.source, "g"); // свежий regex (без общего lastIndex)
  let last = 0;
  let k = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last)
      nodes.push(<span key={`${keyBase}-t${k}`}>{s.slice(last, m.index)}</span>);
    nodes.push(
      <FileChip key={`${keyBase}-l${k}`} file={{ name: m[1], url: m[2] }} inline />
    );
    last = m.index + m[0].length;
    k += 1;
  }
  if (last < s.length)
    nodes.push(<span key={`${keyBase}-t${k}`}>{s.slice(last)}</span>);
  return nodes;
};

// Сообщение пользователя: {filename} заменяем на ссылку на файл (по порядку),
// неиспользованные файлы показываем чипами сверху. Для истории (без files)
// кликабельными становятся markdown-ссылки [name](url) прямо в тексте.
const UserBubble = ({ content, files }) => {
  const atts = Array.isArray(files) ? files : [];
  const parts = splitAiFileTokens(content);
  const inline = [];
  let fi = 0;
  parts.forEach((part, idx) => {
    if (part) inline.push(...renderTextWithLinks(part, `p${idx}`));
    if (idx < parts.length - 1) {
      const file = atts[fi];
      fi += 1;
      inline.push(
        file ? (
          <FileChip key={`f${idx}`} file={file} inline />
        ) : (
          // плейсхолдер без файла — оставляем текст как есть
          <span key={`f${idx}`}>{"{filename}"}</span>
        )
      );
    }
  });
  const rest = atts.slice(fi);
  return (
    <div className={styles.bubble}>
      {rest.length > 0 && (
        <div className={styles.msgFiles}>
          {rest.map((file, i) => (
            <FileChip key={i} file={file} />
          ))}
        </div>
      )}
      {inline.length > 0 && <span>{inline}</span>}
    </div>
  );
};

const TrendDownIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22 17l-8.5-8.5-5 5L2 7" />
    <path d="M16 17h6v-6" />
  </svg>
);
const WalletIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M19 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-2" />
    <path d="M18 12a1 1 0 100 2 1 1 0 000-2z" />
  </svg>
);
const TrendUpIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22 7l-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </svg>
);

const SUGGESTIONS = [
  { key: "suggest1", Icon: TrendDownIcon },
  { key: "suggest2", Icon: WalletIcon },
  { key: "suggest3", Icon: TrendUpIcon },
];

// SVG-иконка скрепки для чипа файла в композере (статическая строка — без XSS)
const CLIP_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>';

// Экранируем URL так, чтобы он не ломал markdown-ссылку [имя](url):
// пробел → %20, ) → %29 (эти символы завершают разбор url). Файл открывается так же.
const mdSafeUrl = (url) =>
  String(url || "")
    .replace(/ /g, "%20")
    .replace(/\)/g, "%29");

// Сериализация contentEditable-композера: текст как есть, чипы файлов → [имя](url),
// переводы строк (br / блочные div) → \n.
const serializeEditor = (root) => {
  if (!root) return "";
  let out = "";
  const walk = (node) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        out += n.textContent;
      } else if (n.nodeName === "BR") {
        out += "\n";
      } else if (n.nodeType === 1 && n.getAttribute?.("data-file-url")) {
        const name = n.getAttribute("data-file-name") || n.textContent;
        out += `[${name}](${mdSafeUrl(n.getAttribute("data-file-url"))})`;
      } else if (n.nodeType === 1) {
        // блочные обёртки строк (браузер оборачивает строки в div)
        if (/^(DIV|P)$/.test(n.nodeName) && out && !out.endsWith("\n")) out += "\n";
        walk(n);
      }
    });
  };
  walk(root);
  return out.replace(/\u00A0/g, " "); // NBSP (вокруг чипов) → обычный пробел
};

// Изменение ширины панели перетаскиванием
const MIN_W = 340;
const MAX_W = 860;
const DEFAULT_W = 424;
const WIDTH_KEY = "aiChatWidth";
const clampWidth = (w) => {
  if (typeof window === "undefined") return w;
  return Math.max(
    Math.min(MIN_W, window.innerWidth),
    Math.min(w, Math.min(MAX_W, window.innerWidth))
  );
};

const AiChatPanel = observer(() => {
  const t = useTranslations("AiChat");
  const mounted = useMounted();
  const isOpen = aiChatStore.isOpen;

  const {
    messages,
    streamingText,
    isAwaiting,
    connected,
    historyLoading,
    hasMore,
    loadingMore,
    loadMore,
    send,
  } = useAiChat(isOpen);

  const [draft, setDraft] = useState(""); // сериализованный текст композера (для disabled)
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_W);
  const [resizing, setResizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef(null);
  const editorRef = useRef(null); // contentEditable-композер (текст + чипы файлов)
  const savedRangeRef = useRef(null); // последняя позиция курсора в композере
  const widthRef = useRef(DEFAULT_W);
  const fileInputRef = useRef(null);
  const prependingRef = useRef(false); // идёт подгрузка старых — сохраняем позицию скролла
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);

  // восстанавливаем сохранённую ширину
  useEffect(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    if (saved) {
      const w = clampWidth(saved);
      widthRef.current = w;
      setPanelWidth(w);
    }
  }, []);

  // перетаскивание левого края → изменение ширины (панель прижата вправо)
  const startResize = (e) => {
    e.preventDefault();
    setResizing(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
    const onMove = (ev) => {
      const w = clampWidth(window.innerWidth - ev.clientX);
      widthRef.current = w;
      setPanelWidth(w);
    };
    const onUp = () => {
      setResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        localStorage.setItem(WIDTH_KEY, String(Math.round(widthRef.current)));
      } catch {
        /* noop */
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // автоскролл вниз при новых сообщениях / стриме;
  // при подгрузке старых (prepend) — держим текущую позицию, а не прыгаем вниз
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (prependingRef.current) {
      el.scrollTop =
        prevScrollTopRef.current + (el.scrollHeight - prevScrollHeightRef.current);
      prependingRef.current = false;
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingText, isAwaiting, isOpen]);

  // скролл вверх → подгрузка старых сообщений
  const onBodyScroll = () => {
    const el = bodyRef.current;
    if (!el || !hasMore || loadingMore) return;
    if (el.scrollTop <= 48) {
      prevScrollHeightRef.current = el.scrollHeight;
      prevScrollTopRef.current = el.scrollTop;
      prependingRef.current = true;
      loadMore();
    }
  };

  // фокус на поле при открытии
  useEffect(() => {
    if (isOpen && mounted) {
      const id = setTimeout(() => editorRef.current?.focus(), 320);
      return () => clearTimeout(id);
    }
  }, [isOpen, mounted]);

  // ─── contentEditable-композер ───────────────────────────────────────

  // запоминаем позицию курсора (нужна для вставки чипа после клика по скрепке)
  const saveCaret = () => {
    const sel = window.getSelection();
    if (
      sel &&
      sel.rangeCount > 0 &&
      editorRef.current?.contains(sel.anchorNode)
    ) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const syncDraft = () => setDraft(serializeEditor(editorRef.current));

  const onEditorInput = () => {
    const el = editorRef.current;
    // пустой contentEditable оставляет <br> — чистим, чтобы работал placeholder (:empty)
    if (el && (el.innerHTML === "<br>" || el.innerHTML === "<div><br></div>")) {
      el.innerHTML = "";
    }
    saveCaret();
    syncDraft();
  };

  // вставка только плоского текста (без форматирования из буфера)
  const onEditorPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain") || "";
    document.execCommand("insertText", false, text);
  };

  // клик по чипу файла в композере → открыть файл
  const onEditorClick = (e) => {
    const chip = e.target.closest?.("a[data-file-url]");
    if (chip) {
      e.preventDefault();
      window.open(chip.getAttribute("data-file-url"), "_blank", "noopener");
    }
  };

  const chipCount = () =>
    editorRef.current?.querySelectorAll("a[data-file-url]").length || 0;

  // Вставляет синие чипы-ссылки файлов на позицию курсора (атомарные, contenteditable=false)
  const insertChips = (files) => {
    const editor = editorRef.current;
    if (!editor || !files.length) return;
    editor.focus();
    let range = savedRangeRef.current;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // курсор неизвестен — вставляем в конец
    }
    range.deleteContents();
    files.forEach((f) => {
      const a = document.createElement("a");
      a.href = f.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.contentEditable = "false";
      a.setAttribute("data-file-url", f.url);
      a.setAttribute("data-file-name", f.name);
      a.className = styles.chipLink;
      a.insertAdjacentHTML("beforeend", CLIP_SVG); // статичный SVG — безопасно
      const label = document.createElement("span");
      label.textContent = f.name; // имя как текст — без XSS
      a.appendChild(label);
      range.insertNode(a);
      range.setStartAfter(a);
      range.collapse(true);
      const space = document.createTextNode(" "); // пробел, чтобы печатать дальше
      range.insertNode(space);
      range.setStartAfter(space);
      range.collapse(true);
    });
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    savedRangeRef.current = range.cloneRange();
    syncDraft();
  };

  const submit = () => {
    const content = serializeEditor(editorRef.current).trim();
    if (!content) return;
    send(content); // чипы уже сериализованы в [имя](url) на своих местах
    if (editorRef.current) editorRef.current.innerHTML = "";
    savedRangeRef.current = null;
    setDraft("");
    setShowSuggestions(false);
  };

  // загрузка файлов → ссылки на CDN
  const handleFilesSelected = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // чтобы можно было выбрать тот же файл повторно
    if (!picked.length) return;

    const slots = AI_CHAT_MAX_FILES - chipCount();
    if (slots <= 0) {
      showErrorNotification(t("filesMax", { max: AI_CHAT_MAX_FILES }));
      return;
    }
    if (picked.some((f) => f.size > AI_CHAT_MAX_FILE_SIZE)) {
      showErrorNotification(t("fileTooBig"));
    }
    const valid = picked
      .filter((f) => f.size <= AI_CHAT_MAX_FILE_SIZE)
      .slice(0, slots);
    if (!valid.length) return;

    setUploading(true);
    try {
      const done = [];
      for (const f of valid) {
        try {
          done.push(await uploadAiChatFile(f));
        } catch {
          showErrorNotification(t("fileUploadError"));
        }
      }
      if (done.length) insertChips(done); // чип файла встаёт в текст там, где курсор
    } finally {
      setUploading(false);
    }
  };

  const pickSuggestion = (text) => {
    send(text);
    setShowSuggestions(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // клики по кнопкам data-prompt внутри ответа AI → новый вопрос
  const onBodyClick = (e) => {
    if (showSuggestions) setShowSuggestions(false);
    const btn = e.target.closest?.("button[data-prompt]");
    const prompt = btn?.dataset?.prompt;
    if (prompt) send(prompt);
  };

  const showGreeting = !historyLoading && messages.length === 0 && !streamingText && !isAwaiting;

  // AI-ассистент включается флагом ia_active из get_general_settings
  if (!appStore.isAiActive) return null;

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.open : ""}`}
        onClick={() => aiChatStore.close()}
      />
      <aside
        className={`${styles.panel} ${isOpen ? "" : styles.closed} ${resizing ? styles.resizing : ""}`}
        style={{ width: panelWidth }}
        aria-hidden={!isOpen}
      >
        {/* Ручка изменения ширины (левый край, по центру) */}
        <div
          className={styles.resizeHandle}
          onPointerDown={startResize}
          role="separator"
          aria-orientation="vertical"
          aria-label={t("resizeHint")}
        />

        {/* Header */}
        <div className={styles.head}>
          <div className={styles.avatar}>
            <SparkIcon />
          </div>
          <div>
            <div className={styles.title}>
              {t("title")}
              <span className={`${styles.dot} ${connected ? "" : styles.off}`} />
            </div>
            <div className={styles.sub}>{t("subtitle")}</div>
          </div>
          <button
            className={styles.close}
            onClick={() => aiChatStore.close()}
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          className={styles.body}
          ref={bodyRef}
          onClick={onBodyClick}
          onScroll={onBodyScroll}
        >
          {/* подгрузка старых сообщений при скролле вверх */}
          {loadingMore && (
            <div className={styles.loadMore}>
              <span className={styles.spin} />
            </div>
          )}

          <div className={styles.daySep}>{t("today")}</div>

          {showGreeting && (
            <div className={styles.msg}>
              <div className={styles.ava}>
                <SparkIcon />
              </div>
              <div className={styles.bubble}>{t("greeting")}</div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div className={`${styles.msg} ${styles.me}`} key={m.id}>
                <UserBubble content={m.content} files={m.files} />
              </div>
            ) : (
              <div className={styles.msg} key={m.id}>
                <div className={styles.ava}>
                  <SparkIcon />
                </div>
                {m.isHtml ? (
                  <div
                    className={styles.bubble}
                    dangerouslySetInnerHTML={{ __html: sanitizeAiHtml(m.content) }}
                  />
                ) : (
                  <div className={styles.bubble}>{m.content}</div>
                )}
              </div>
            )
          )}

          {/* живой стрим — рендерим как HTML (DOMPurify корректно закрывает незавершённые теги) */}
          {streamingText !== null && (
            <div className={styles.msg}>
              <div className={styles.ava}>
                <SparkIcon />
              </div>
              <div className={styles.bubble}>
                <span
                  dangerouslySetInnerHTML={{ __html: sanitizeAiHtml(streamingText) }}
                />
                <span className={styles.cursor} />
              </div>
            </div>
          )}

          {/* ждём первый токен */}
          {isAwaiting && streamingText === null && (
            <div className={styles.msg}>
              <div className={styles.ava}>
                <SparkIcon />
              </div>
              <div className={styles.bubble} style={{ padding: "4px 6px" }}>
                <div className={styles.typing}>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className={styles.composer}>
          {/* всплывающие подсказки — по кнопке «+» */}
          {showSuggestions && (
            <div className={styles.suggestPop}>
              <div className={styles.suggestHead}>{t("suggestTitle")}</div>
              {SUGGESTIONS.map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={styles.suggestItem}
                  onClick={() => pickSuggestion(t(key))}
                >
                  <span className={styles.suggestIco}>
                    <Icon />
                  </span>
                  {t(key)}
                </button>
              ))}
            </div>
          )}

          <div className={styles.inp}>
            <button
              type="button"
              className={`${styles.plus} ${showSuggestions ? styles.plusOn : ""}`}
              onClick={() => setShowSuggestions((v) => !v)}
              aria-label={t("suggestTitle")}
              aria-expanded={showSuggestions}
            >
              <PlusIcon />
            </button>
            <button
              type="button"
              className={styles.attach}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label={t("attach")}
            >
              {uploading ? <span className={styles.spin} /> : <ClipIcon />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFilesSelected}
            />
            <div
              ref={editorRef}
              className={styles.editor}
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label={t("placeholder")}
              data-placeholder={t("placeholder")}
              onInput={onEditorInput}
              onKeyDown={onKeyDown}
              onKeyUp={saveCaret}
              onMouseUp={saveCaret}
              onPaste={onEditorPaste}
              onClick={onEditorClick}
              onFocus={() => {
                saveCaret();
                if (showSuggestions) setShowSuggestions(false);
              }}
            />
            <button
              className={styles.send}
              onClick={submit}
              disabled={!draft.trim() || uploading}
              aria-label={t("send")}
            >
              <SendIcon />
            </button>
          </div>
          <div className={styles.footNote}>{t("footNote")}</div>
        </div>
      </aside>
    </>
  );
});

export default AiChatPanel;
