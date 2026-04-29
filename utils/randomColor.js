const VARIANT_DELTA = {
  light: 15,
  dark: -15,
  lighter: 32,
  darker: -32,
  "more-light": 32,
  "more-dark": -32,
};

export function getRandomColor(base, variant) {
  // No base → completely random
  if (!base) {
    const h = Math.floor(Math.random() * 360);
    const s = 55 + Math.random() * 35; // 55–90, avoids muddy grays
    const l = 35 + Math.random() * 40; // 35–75, avoids pure black/white
    return hslToHex(h, s, l);
  }

  const { h, s, l } = hexToHsl(base);

  // Determine the lightness delta + how wildly to jitter
  let delta, jitterH, jitterS, jitterL;

  if (variant === undefined || variant === null) {
    // No variant → produce a meaningfully different but related color.
    // Wide ranges so consecutive calls don't all look identical.
    delta = (Math.random() - 0.5) * 60; // ±30% lightness
    jitterH = (Math.random() - 0.5) * 50; // ±25° hue (analogous range)
    jitterS = (Math.random() - 0.5) * 30; // ±15% saturation
    jitterL = 0;
  } else {
    // Explicit variant → targeted shift with small jitter so it still varies
    delta =
      typeof variant === "number"
        ? variant
        : VARIANT_DELTA[variant] ?? 0;
    jitterH = (Math.random() - 0.5) * 14; // ±7°
    jitterS = (Math.random() - 0.5) * 10; // ±5%
    jitterL = (Math.random() - 0.5) * 6;  // ±3%
  }

  const newH = (h + jitterH + 360) % 360;
  const newS = clamp(s + jitterS, 25, 95); // keep saturation in a usable range
  const newL = clamp(l + delta + jitterL, 15, 88);

  return hslToHex(newH, newS, newL);
}

/* ─── Helpers ────────────────────────────────────────────── */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hexToHsl(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue *= 60;
  }
  return { h: hue, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
