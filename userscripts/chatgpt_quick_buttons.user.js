// ==UserScript==
// @name         ChatGPT 快捷按钮
// @namespace    yian
// @version      1.1.0
// @description  一次安装，自动加载最新版快捷按钮核心；优先 GitHub API，自动绕过旧缓存。
// @match        https://chatgpt.com/*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/louisong1021-ux/page/main/userscripts/chatgpt_quick_buttons.user.js
// @updateURL    https://raw.githubusercontent.com/louisong1021-ux/page/main/userscripts/chatgpt_quick_buttons.user.js
// ==/UserScript==

(() => {
  'use strict';

  const API_URL = 'https://api.github.com/repos/louisong1021-ux/page/contents/userscripts/chatgpt_quick_buttons_core.js?ref=main';
  const RAW_URL = 'https://raw.githubusercontent.com/louisong1021-ux/page/main/userscripts/chatgpt_quick_buttons_core.js';
  const CACHE_KEY = 'yian_chatgpt_quick_buttons_last_good_core_v2';

  function run(code, source) {
    try {
      // Always remove any stale toolbar/style before the newest core runs.
      document.getElementById('yian-chatgpt-quick-bar-stable')?.remove();
      document.getElementById('yian-chatgpt-quick-style-stable')?.remove();

      (0, eval)(code + '\n//# sourceURL=' + source);
      return true;
    } catch (err) {
      console.error('[YIAN Quick Buttons] core execution failed:', err);
      return false;
    }
  }

  function decodeBase64Utf8(base64) {
    const binary = atob(base64.replace(/\n/g, ''));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }

  async function fetchFromApi() {
    const response = await fetch(API_URL + '&_=' + Date.now(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      headers: { 'Accept': 'application/vnd.github+json' }
    });

    if (!response.ok) throw new Error('GitHub API HTTP ' + response.status);

    const data = await response.json();
    if (!data?.content) throw new Error('GitHub API returned no content');

    return decodeBase64Utf8(data.content);
  }

  async function fetchFromRaw() {
    const response = await fetch(RAW_URL + '?_=' + Date.now(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit'
    });

    if (!response.ok) throw new Error('Raw GitHub HTTP ' + response.status);

    return await response.text();
  }

  async function getLatestCore() {
    try {
      const code = await fetchFromApi();
      if (code && code.length > 500) return code;
    } catch (err) {
      console.warn('[YIAN Quick Buttons] GitHub API fetch failed:', err);
    }

    try {
      const code = await fetchFromRaw();
      if (code && code.length > 500) return code;
    } catch (err) {
      console.warn('[YIAN Quick Buttons] raw GitHub fetch failed:', err);
    }

    return null;
  }

  async function boot() {
    const latest = await getLatestCore();

    if (latest && run(latest, 'yian-latest-core.js')) {
      try { localStorage.setItem(CACHE_KEY, latest); } catch {}
      return;
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && run(cached, 'yian-cached-core.js')) return;
    } catch {}

    console.error('[YIAN Quick Buttons] no usable core available');
  }

  boot();
})();
