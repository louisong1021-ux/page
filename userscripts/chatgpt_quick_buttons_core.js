// YIAN ChatGPT Quick Buttons Core v1.0.4
(() => {
  'use strict';

  // Always replace stale UI/CSS from an older core version.
  document.getElementById('yian-chatgpt-quick-bar-stable')?.remove();
  document.getElementById('yian-chatgpt-quick-style-stable')?.remove();

  const BAR_ID = 'yian-chatgpt-quick-bar-stable';
  const STYLE_ID = 'yian-chatgpt-quick-style-stable';
  let positionRaf = 0;
  let lastShell = null;

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return (
      rect.width > 80 &&
      rect.height > 20 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden'
    );
  }

  function findComposer() {
    const primary = document.querySelector('#prompt-textarea');
    if (isVisible(primary)) return primary;

    const unified = document.querySelector('[data-type="unified-composer"]');
    if (unified) {
      const el = unified.querySelector(
        'textarea, [contenteditable="true"][data-lexical-editor="true"], [contenteditable="true"]'
      );
      if (isVisible(el)) return el;
    }

    // Fallback: choose the visible editable element nearest the bottom of the viewport.
    const candidates = Array.from(
      document.querySelectorAll('textarea, [contenteditable="true"]')
    )
      .filter(isVisible)
      .filter(el => !el.closest('article, [data-message-author-role], pre, code, dialog, [role="dialog"]'))
      .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);

    return candidates[0] || null;
  }

  function findComposerShell() {
    const composer = findComposer();
    if (!composer) return null;

    const unified = composer.closest('[data-type="unified-composer"]');
    if (unified) return unified;

    const form = composer.closest('form');
    if (form) return form;

    return composer.parentElement;
  }

  function dismissKeyboard(el) {
    try { el?.blur?.(); } catch {}
    try {
      const active = document.activeElement;
      if (active && active !== document.body && typeof active.blur === 'function') {
        active.blur();
      }
    } catch {}
    try { window.getSelection()?.removeAllRanges(); } catch {}
  }

  function setComposerText(el, text) {
    const hadInputMode = el.hasAttribute('inputmode');
    const previousInputMode = el.getAttribute('inputmode');

    try { el.setAttribute('inputmode', 'none'); } catch {}
    try { el.focus({ preventScroll: true }); } catch { el.focus(); }

    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      const proto =
        el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;

      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, text);
      else el.value = text;

      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (el.isContentEditable) {
      const selection = window.getSelection();
      const range = document.createRange();

      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);

      document.execCommand('delete', false);
      document.execCommand('insertText', false, text);

      el.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          inputType: 'insertText',
          data: text
        })
      );
    }

    dismissKeyboard(el);

    window.setTimeout(() => {
      try {
        if (hadInputMode) el.setAttribute('inputmode', previousInputMode ?? '');
        else el.removeAttribute('inputmode');
      } catch {}
    }, 500);
  }

  function findSendButton(composer) {
    const form = composer?.closest('form');
    const root = form || document;

    const selectors = [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send"]',
      'button[aria-label*="发送"]'
    ];

    for (const selector of selectors) {
      const btn = root.querySelector(selector);
      if (btn) return btn;
    }

    return null;
  }

  async function submitCommand(text, sourceButton) {
    if (sourceButton?.dataset.busy === '1') return;

    if (sourceButton) {
      sourceButton.dataset.busy = '1';
      sourceButton.style.opacity = '0.55';
    }

    try {
      const composer = findComposer();

      if (!composer) {
        alert('没有找到 ChatGPT 主输入框，请刷新页面后重试。');
        return;
      }

      setComposerText(composer, text);
      dismissKeyboard(composer);
      window.setTimeout(() => dismissKeyboard(composer), 80);

      for (let i = 0; i < 25; i++) {
        await new Promise(resolve => setTimeout(resolve, 60));

        const sendButton = findSendButton(composer);
        if (sendButton && !sendButton.disabled) {
          dismissKeyboard(composer);
          sendButton.click();

          window.setTimeout(() => dismissKeyboard(composer), 60);
          window.setTimeout(() => dismissKeyboard(composer), 240);
          return;
        }
      }

      const form = composer.closest('form');
      if (form && typeof form.requestSubmit === 'function') {
        dismissKeyboard(composer);
        form.requestSubmit();

        window.setTimeout(() => dismissKeyboard(composer), 80);
        window.setTimeout(() => dismissKeyboard(composer), 240);
        return;
      }

      alert('内容已填入，但没有找到 ChatGPT 的发送按钮。');
    } finally {
      window.setTimeout(() => {
        if (sourceButton) {
          sourceButton.dataset.busy = '0';
          sourceButton.style.opacity = '';
        }
      }, 700);
    }
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BAR_ID} {
        position: fixed;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 7px;
        height: 54px;
        padding: 0 4px;
        background: transparent;
        border: 0;
        box-shadow: none;
        z-index: 2147483647;
        box-sizing: border-box;
        pointer-events: none;
      }

      #${BAR_ID} .yian-quick-btn {
        pointer-events: auto;
        min-width: 0;
        height: 50px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        appearance: none;
        -webkit-appearance: none;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 999px;
        background: rgba(255,255,255,0.07);
        color: rgba(255,255,255,0.96);
        -webkit-backdrop-filter: blur(16px) saturate(135%);
        backdrop-filter: blur(16px) saturate(135%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.10);
        font: inherit;
        font-size: 19px;
        line-height: 1;
        font-weight: 600;
        padding: 0 20px;
        margin: 0;
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
        transition: transform .12s ease, background .12s ease, opacity .12s ease;
      }

      #${BAR_ID} .yian-quick-btn:active {
        background: rgba(255,255,255,0.13);
        opacity: 0.88;
        transform: scale(0.97);
      }

      @media (prefers-color-scheme: light) {
        #${BAR_ID} .yian-quick-btn {
          color: rgba(0,0,0,0.88);
          background: rgba(255,255,255,0.56);
          border-color: rgba(0,0,0,0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), 0 2px 8px rgba(0,0,0,0.08);
        }
      }

      @media (max-width: 600px) {
        #${BAR_ID} {
          height: 50px;
          gap: 6px;
          padding: 0 3px;
        }

        #${BAR_ID} .yian-quick-btn {
          height: 46px;
          font-size: 18px;
          padding: 0 17px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function positionBar() {
    positionRaf = 0;
    const bar = document.getElementById(BAR_ID);
    if (!bar) return;

    // Keep vertical position fixed. Only use the real ChatGPT composer
    // to align the toolbar's right edge; never follow reply content.
    let rightOffset = 16;
    const shell = findComposerShell();

    if (shell) {
      const rect = shell.getBoundingClientRect();
      if (rect.width > 220 && rect.right > 0) {
        rightOffset = Math.max(12, Math.round(window.innerWidth - rect.right));
      }
    }

    Object.assign(bar.style, {
      left: 'auto',
      right: `${rightOffset}px`,
      top: 'auto',
      bottom: 'calc(126px + env(safe-area-inset-bottom))',
      width: 'auto'
    });
  }

  function schedulePosition() {
    if (positionRaf) return;
    positionRaf = requestAnimationFrame(positionBar);
  }

  function createBar() {
    if (document.getElementById(BAR_ID)) {
      schedulePosition();
      return;
    }

    installStyle();

    const bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'ChatGPT 快捷操作');

    function makeButton(label, command) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'yian-quick-btn';
      button.textContent = label;
      button.dataset.busy = '0';
      button.addEventListener('click', () => submitCommand(command, button));
      return button;
    }

    bar.appendChild(makeButton('写短信', '写短信'));
    bar.appendChild(makeButton('写邮件', '写邮件'));
    bar.appendChild(makeButton('发送', '发送'));
    bar.appendChild(makeButton('加微信', '加微信'));
    bar.appendChild(makeButton('下一条', '下一条'));

    document.body.appendChild(bar);
    schedulePosition();
  }

  createBar();

  // Page content may change, but button position never follows it.
  const observer = new MutationObserver(() => {
    if (!document.getElementById(BAR_ID)) createBar();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener('resize', schedulePosition, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(schedulePosition, 200);
  }, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', schedulePosition, { passive: true });
  }

  setInterval(() => {
    if (!document.getElementById(BAR_ID)) createBar();
  }, 1500);
})();
