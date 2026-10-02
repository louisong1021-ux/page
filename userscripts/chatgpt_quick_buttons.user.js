// ==UserScript==
// @name         ChatGPT 快捷按钮
// @namespace    yian
// @version      1.0.0
// @description  一次安装，自动加载最新版快捷按钮核心；自动绕过缓存并保留上次可用版本。
// @match        https://chatgpt.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const CORE_URL = 'https://raw.githubusercontent.com/louisong1021-ux/page/main/userscripts/chatgpt_quick_buttons_core.js';
  const CACHE_KEY = 'yian_chatgpt_quick_buttons_last_good_core_v1';

  function run(code, source) {
    try {
      // Indirect eval executes the downloaded core in the page userscript context.
      (0, eval)(code + '\n//# sourceURL=' + source);
      return true;
    } catch (err) {
      console.error('[YIAN Quick Buttons] core execution failed:', err);
      return false;
    }
  }

  async function boot() {
    try {
      const url = CORE_URL + '?v=' + Date.now();
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit'
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);

      const code = await response.text();
      if (!code || code.length < 500) throw new Error('Core file is unexpectedly short');

      if (run(code, CORE_URL)) {
        try { localStorage.setItem(CACHE_KEY, code); } catch {}
        return;
      }
    } catch (err) {
      console.warn('[YIAN Quick Buttons] latest core unavailable, using cached core:', err);
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && run(cached, 'yian-cached-core.js')) return;
    } catch {}

    console.error('[YIAN Quick Buttons] no usable core available');
  }

  boot();
})();
