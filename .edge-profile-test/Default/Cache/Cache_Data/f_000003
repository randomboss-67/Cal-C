/**
 * Cal-C — Material 3 Expressive Mobile-First Calculator
 * 100% Offline | Spring Squircle Physics | OnePlus Red "=" & Easter Egg
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    expression: '',
    lastResult: null,
    isEvaluated: false,
    isEasterEgg: false,
    soundEnabled: true,
    theme: 'dark',
    history: []
  };

  // --- DOM ELEMENTS ---
  const displayCard = document.getElementById('displayCard');
  const displayNormal = document.getElementById('displayNormal');
  const displayEasterEgg = document.getElementById('displayEasterEgg');
  const expressionDisplay = document.getElementById('expressionDisplay');
  const resultDisplay = document.getElementById('resultDisplay');
  const livePreview = document.getElementById('livePreview');
  const btnAC = document.getElementById('btnAC');
  const btnEquals = document.getElementById('btnEquals');
  const btnInlineBackspace = document.getElementById('btnInlineBackspace');

  const btnToggleSound = document.getElementById('btnToggleSound');
  const iconSoundOn = document.getElementById('iconSoundOn');
  const iconSoundOff = document.getElementById('iconSoundOff');

  const btnToggleTheme = document.getElementById('btnToggleTheme');
  const iconThemeDark = document.getElementById('iconThemeDark');
  const iconThemeLight = document.getElementById('iconThemeLight');

  const btnOpenHistory = document.getElementById('btnOpenHistory');
  const btnCloseHistory = document.getElementById('btnCloseHistory');
  const btnClearHistory = document.getElementById('btnClearHistory');
  const historyDrawer = document.getElementById('historyDrawer');
  const historyList = document.getElementById('historyList');

  const btnToggleExtended = document.getElementById('btnToggleExtended');
  const extendedRow = document.getElementById('extendedRow');
  const extendedPillLabel = document.getElementById('extendedPillLabel');
  const offlinePill = document.getElementById('offlinePill');

  const keypadButtons = document.querySelectorAll('.calc-btn');

  // --- WEB AUDIO API (100% Offline Synthesizer) ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration = 0.04, type = 'sine', gainVal = 0.12) {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }

  function playHaptic(duration = 10) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (e) {}
    }
  }

  function playKeySound(type) {
    switch (type) {
      case 'digit':
        playTone(520, 0.035, 'sine', 0.1);
        playHaptic(8);
        break;
      case 'op':
        playTone(660, 0.04, 'triangle', 0.12);
        playHaptic(12);
        break;
      case 'fn':
        playTone(480, 0.04, 'sine', 0.1);
        playHaptic(10);
        break;
      case 'clear':
        playTone(380, 0.06, 'sine', 0.12);
        playHaptic(15);
        break;
      case 'equals':
        playTone(784, 0.08, 'triangle', 0.16);
        playHaptic([12, 40, 16]);
        break;
      case 'easter-egg':
        // Celebratory OnePlus two-tone chime
        if (!state.soundEnabled) return;
        try {
          initAudio();
          if (!audioCtx) return;
          const now = audioCtx.currentTime;
          [
            { f: 523.25, t: 0, d: 0.12 },
            { f: 659.25, t: 0.1, d: 0.14 },
            { f: 783.99, t: 0.22, d: 0.28 }
          ].forEach(({ f, t, d }) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + t);
            gain.gain.setValueAtTime(0.2, now + t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + t);
            osc.stop(now + t + d);
          });
          playHaptic([30, 60, 40, 60, 80]);
        } catch (e) {}
        break;
    }
  }

  // --- BUTTON SQUIRCLE SPRING ANIMATION & RIPPLE ---
  function triggerButtonAnimation(btn, event) {
    if (!btn) return;

    // Remove existing bounce class to allow re-trigger
    btn.classList.remove('squircle-spring');
    void btn.offsetWidth; // Force CSS reflow
    btn.classList.add('squircle-spring');

    // Create ink ripple
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-wave');

    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;

    let clientX = rect.left + rect.width / 2;
    let clientY = rect.top + rect.height / 2;

    if (event && event.clientX && event.clientY) {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    ripple.style.left = `${clientX - rect.left - size / 2}px`;
    ripple.style.top = `${clientY - rect.top - size / 2}px`;

    btn.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 500);

    btn.addEventListener(
      'animationend',
      () => {
        btn.classList.remove('squircle-spring');
      },
      { once: true }
    );
  }

  // --- ONEPLUS EASTER EGG ---
  /**
   * Requirement:
   * When input is exactly "1+" and "=" is clicked,
   * turn the display card into #EB0028 and show ONLY the boxed "1+" icon
   * and "NEVER SETTLE" in white bold uppercase text
   * (no extra labels, subtitles, or duplicate top expression text).
   */
  function checkEasterEggTrigger() {
    const trimmed = state.expression.trim();
    return trimmed === '1+' || trimmed === '1 +';
  }

  function activateEasterEgg() {
    state.isEasterEgg = true;
    displayCard.classList.add('easter-egg-active');
    playKeySound('easter-egg');
  }

  function exitEasterEgg() {
    if (!state.isEasterEgg) return;
    state.isEasterEgg = false;
    displayCard.classList.remove('easter-egg-active');
  }

  // --- MATH EVALUATION ENGINE ---
  function sanitizeExpression(expr) {
    return expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/²/g, '**2')
      .replace(/³/g, '**3');
  }

  function stripPrecision(num) {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return num;
    return parseFloat(num.toPrecision(12));
  }

  function evaluatePercent(expr) {
    // Handle percentage cases: A + B%, A - B%, A × B%, A ÷ B%, B%
    // 100 + 10% => 100 + (100 * 0.10) = 110
    // 100 - 10% => 100 - (100 * 0.10) = 90
    // 50 * 20% => 50 * 0.20 = 10
    return expr.replace(/([0-9.]+)\s*([+\-*\/])\s*([0-9.]+)%/g, (match, a, op, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (op === '+' || op === '-') {
        return `${numA} ${op} (${numA} * ${numB / 100})`;
      } else {
        return `${numA} ${op} (${numB / 100})`;
      }
    }).replace(/([0-9.]+)%/g, '($1 / 100)');
  }

  function evaluateMath(expr) {
    if (!expr || expr.trim() === '') return { ok: true, val: 0 };

    try {
      let prepared = evaluatePercent(expr);
      prepared = sanitizeExpression(prepared);

      // Check for division by zero
      if (/\/0(?![.0-9])/.test(prepared)) {
        return { ok: false, error: 'Cannot divide by 0' };
      }

      // Safe evaluation with math tokens only
      // Valid chars: digits, +, -, *, /, (, ), ., **, space
      if (!/^[0-9+\-*\/().\s]+$/.test(prepared)) {
        return { ok: false, error: 'Format Error' };
      }

      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${prepared})`)();

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return { ok: false, error: 'Error' };
      }

      return { ok: true, val: stripPrecision(result) };
    } catch (e) {
      return { ok: false, error: null };
    }
  }

  // --- DISPLAY UPDATES ---
  function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    if (typeof num === 'string') return num;
    const str = num.toString();
    if (str.includes('e') || str.includes('E')) return str;
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function updateDisplay() {
    // Update AC / C button label
    if (state.expression.length > 0 || state.isEvaluated) {
      btnAC.textContent = 'C';
    } else {
      btnAC.textContent = 'AC';
    }

    if (state.isEvaluated) {
      expressionDisplay.textContent = state.expression;
      resultDisplay.textContent = formatNumber(state.lastResult);
      livePreview.textContent = '';
      adjustFontSize(resultDisplay);
      return;
    }

    expressionDisplay.textContent = state.expression;

    if (!state.expression) {
      resultDisplay.textContent = '0';
      livePreview.textContent = '';
      adjustFontSize(resultDisplay);
      return;
    }

    // Live preview calculation
    const lastChar = state.expression.slice(-1);
    if (!['+', '-', '×', '÷', '('].includes(lastChar)) {
      const res = evaluateMath(state.expression);
      if (res.ok && res.val !== null) {
        livePreview.textContent = `= ${formatNumber(res.val)}`;
      } else {
        livePreview.textContent = '';
      }
    } else {
      livePreview.textContent = '';
    }

    // Extract current active operand for main result
    const tokens = state.expression.split(/[+\-×÷]/);
    const currentToken = tokens[tokens.length - 1] || '0';
    resultDisplay.textContent = currentToken;
    adjustFontSize(resultDisplay);

    // Auto-scroll expression to right
    expressionDisplay.scrollLeft = expressionDisplay.scrollWidth;
  }

  function adjustFontSize(el) {
    const textLength = el.textContent.length;
    if (textLength > 12) {
      el.style.fontSize = '1.75rem';
    } else if (textLength > 8) {
      el.style.fontSize = '2.25rem';
    } else {
      el.style.fontSize = '';
    }
  }

  // --- ACTIONS ---
  function inputDigit(digit) {
    if (state.isEasterEgg) {
      exitEasterEgg();
      state.expression = digit;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.isEvaluated) {
      state.expression = digit;
      state.isEvaluated = false;
    } else {
      // Prevent multiple leading zeroes
      if (state.expression === '0') {
        state.expression = digit;
      } else {
        state.expression += digit;
      }
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (state.isEasterEgg) {
      exitEasterEgg();
      state.expression = '0.';
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.isEvaluated) {
      state.expression = '0.';
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    // Check if the current token already contains a decimal
    const tokens = state.expression.split(/[+\-×÷]/);
    const current = tokens[tokens.length - 1];
    if (!current.includes('.')) {
      if (current === '' || ['+', '-', '×', '÷'].includes(state.expression.slice(-1))) {
        state.expression += '0.';
      } else {
        state.expression += '.';
      }
      updateDisplay();
    }
  }

  function inputOperator(op) {
    if (state.isEasterEgg) {
      exitEasterEgg();
      state.expression = '1' + op;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.isEvaluated) {
      state.expression = (state.lastResult !== null ? state.lastResult.toString() : '0') + op;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (!state.expression) {
      if (op === '-') {
        state.expression = '-';
        updateDisplay();
      }
      return;
    }

    const lastChar = state.expression.slice(-1);
    if (['+', '-', '×', '÷'].includes(lastChar)) {
      // Replace existing operator
      state.expression = state.expression.slice(0, -1) + op;
    } else {
      state.expression += op;
    }
    updateDisplay();
  }

  function inputSquare() {
    if (state.isEasterEgg) {
      exitEasterEgg();
      state.expression = '1²';
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.isEvaluated && state.lastResult !== null) {
      state.expression = `${state.lastResult}²`;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (!state.expression) {
      state.expression = '0²';
      updateDisplay();
      return;
    }

    const lastChar = state.expression.slice(-1);
    if (!['+', '-', '×', '÷', '('].includes(lastChar)) {
      state.expression += '²';
      updateDisplay();
    }
  }

  function inputCube() {
    if (state.isEasterEgg) {
      exitEasterEgg();
      state.expression = '1³';
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.isEvaluated && state.lastResult !== null) {
      state.expression = `${state.lastResult}³`;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (!state.expression) {
      state.expression = '0³';
      updateDisplay();
      return;
    }

    const lastChar = state.expression.slice(-1);
    if (!['+', '-', '×', '÷', '('].includes(lastChar)) {
      state.expression += '³';
      updateDisplay();
    }
  }

  function inputPercent() {
    if (state.isEasterEgg) {
      exitEasterEgg();
    }

    if (state.isEvaluated && state.lastResult !== null) {
      state.expression = `${state.lastResult}%`;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (!state.expression) return;
    const lastChar = state.expression.slice(-1);
    if (!['+', '-', '×', '÷', '(', '%'].includes(lastChar)) {
      state.expression += '%';
      updateDisplay();
    }
  }

  function inputNegate() {
    if (state.isEasterEgg) {
      exitEasterEgg();
    }

    if (state.isEvaluated && state.lastResult !== null) {
      state.lastResult = -state.lastResult;
      state.expression = state.lastResult.toString();
      updateDisplay();
      return;
    }

    if (!state.expression) {
      state.expression = '-';
      updateDisplay();
      return;
    }

    // Toggle negation on last operand
    const match = state.expression.match(/([+\-×÷(]?)([-0-9.]+)$/);
    if (match) {
      const prefix = match[1];
      const val = match[2];
      const rest = state.expression.slice(0, match.index);
      if (val.startsWith('-')) {
        state.expression = rest + prefix + val.slice(1);
      } else {
        state.expression = rest + prefix + '-' + val;
      }
      updateDisplay();
    }
  }

  function inputParenthesis(char) {
    if (state.isEasterEgg) {
      exitEasterEgg();
      state.expression = char;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.isEvaluated) {
      state.expression = char;
      state.isEvaluated = false;
    } else {
      state.expression += char;
    }
    updateDisplay();
  }

  function handleBackspace() {
    if (state.isEasterEgg) {
      exitEasterEgg();
      state.expression = '1';
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.isEvaluated) {
      state.expression = '';
      state.lastResult = null;
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    if (state.expression.length > 0) {
      state.expression = state.expression.slice(0, -1);
      updateDisplay();
    }
  }

  function handleClear() {
    exitEasterEgg();
    state.expression = '';
    state.lastResult = null;
    state.isEvaluated = false;
    updateDisplay();
  }

  function calculateResult() {
    // Check Easter Egg: When input is exactly "1+" and "=" is clicked
    if (checkEasterEggTrigger()) {
      activateEasterEgg();
      return;
    }

    if (state.isEasterEgg) {
      // Re-trigger bounce
      playKeySound('easter-egg');
      return;
    }

    if (!state.expression) return;

    const res = evaluateMath(state.expression);
    if (!res.ok) {
      if (res.error) {
        resultDisplay.textContent = res.error;
        livePreview.textContent = '';
      }
      return;
    }

    const calculatedVal = res.val;
    saveToHistory(state.expression, calculatedVal);

    state.lastResult = calculatedVal;
    state.isEvaluated = true;
    updateDisplay();
    playKeySound('equals');
  }

  // --- HISTORY MANAGEMENT ---
  function saveToHistory(expr, result) {
    const item = {
      id: Date.now(),
      expr,
      result
    };
    state.history.unshift(item);
    if (state.history.length > 30) {
      state.history.pop();
    }
    try {
      localStorage.setItem('calc_history', JSON.stringify(state.history));
    } catch (e) {}
    renderHistory();
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem('calc_history');
      if (saved) {
        state.history = JSON.parse(saved);
        renderHistory();
      }
    } catch (e) {}
  }

  function renderHistory() {
    if (!historyList) return;
    if (state.history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
      return;
    }

    historyList.innerHTML = '';
    state.history.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.setAttribute('role', 'button');
      div.setAttribute('tabindex', '0');
      div.innerHTML = `
        <span class="history-expr">${item.expr}</span>
        <span class="history-res">= ${formatNumber(item.result)}</span>
      `;
      div.addEventListener('click', () => {
        exitEasterEgg();
        state.expression = item.result.toString();
        state.lastResult = item.result;
        state.isEvaluated = true;
        updateDisplay();
        closeHistory();
      });
      historyList.appendChild(div);
    });
  }

  function openHistory() {
    historyDrawer.classList.add('is-open');
    historyDrawer.setAttribute('aria-hidden', 'false');
  }

  function closeHistory() {
    historyDrawer.classList.remove('is-open');
    historyDrawer.setAttribute('aria-hidden', 'true');
  }

  function clearHistory() {
    state.history = [];
    try {
      localStorage.removeItem('calc_history');
    } catch (e) {}
    renderHistory();
  }

  // --- THEME MANAGEMENT ---
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      iconThemeDark.style.display = 'none';
      iconThemeLight.style.display = 'block';
    } else {
      iconThemeDark.style.display = 'block';
      iconThemeLight.style.display = 'none';
    }
    try {
      localStorage.setItem('calc_theme', theme);
    } catch (e) {}
  }

  function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    playKeySound('fn');
  }

  // --- SOUND TOGGLE ---
  function setSound(enabled) {
    state.soundEnabled = enabled;
    if (enabled) {
      iconSoundOn.style.display = 'block';
      iconSoundOff.style.display = 'none';
    } else {
      iconSoundOn.style.display = 'none';
      iconSoundOff.style.display = 'block';
    }
    try {
      localStorage.setItem('calc_sound', enabled ? 'true' : 'false');
    } catch (e) {}
  }

  function toggleSound() {
    setSound(!state.soundEnabled);
    if (state.soundEnabled) {
      playTone(600, 0.05, 'sine', 0.15);
    }
  }

  // --- SCIENTIFIC ROW TOGGLE ---
  function toggleExtendedRow() {
    const isHidden = extendedRow.style.display === 'none';
    if (isHidden) {
      extendedRow.style.display = 'grid';
      btnToggleExtended.setAttribute('aria-expanded', 'true');
      extendedPillLabel.textContent = 'Hide Scientific Functions ▴';
    } else {
      extendedRow.style.display = 'none';
      btnToggleExtended.setAttribute('aria-expanded', 'false');
      extendedPillLabel.textContent = 'Scientific Functions ( ) % ± ▾';
    }
    playKeySound('fn');
  }

  // --- EVENT DISPATCHER ---
  function handleButtonAction(btn, event) {
    triggerButtonAnimation(btn, event);

    const action = btn.dataset.action;
    const val = btn.dataset.val;

    switch (action) {
      case 'digit':
        playKeySound('digit');
        inputDigit(val);
        break;
      case 'decimal':
        playKeySound('digit');
        inputDecimal();
        break;
      case 'operator':
        playKeySound('op');
        inputOperator(val);
        break;
      case 'square':
        playKeySound('fn');
        inputSquare();
        break;
      case 'cube':
        playKeySound('fn');
        inputCube();
        break;
      case 'percent':
        playKeySound('fn');
        inputPercent();
        break;
      case 'negate':
        playKeySound('fn');
        inputNegate();
        break;
      case 'parenthesis-open':
        playKeySound('fn');
        inputParenthesis('(');
        break;
      case 'parenthesis-close':
        playKeySound('fn');
        inputParenthesis(')');
        break;
      case 'backspace':
        playKeySound('fn');
        handleBackspace();
        break;
      case 'clear':
        playKeySound('clear');
        handleClear();
        break;
      case 'calculate':
        calculateResult();
        break;
    }
  }

  // --- KEYBOARD SHORTCUTS ---
  function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;
    let targetBtn = null;

    if (key >= '0' && key <= '9') {
      targetBtn = document.querySelector(`.calc-btn[data-action="digit"][data-val="${key}"]`);
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === '.') {
      targetBtn = document.querySelector('.calc-btn[data-action="decimal"]');
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === '+') {
      targetBtn = document.querySelector('.calc-btn[data-action="operator"][data-val="+"]');
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === '-') {
      targetBtn = document.querySelector('.calc-btn[data-action="operator"][data-val="-"]');
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === '*') {
      targetBtn = document.querySelector('.calc-btn[data-action="operator"][data-val="×"]');
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === '/') {
      e.preventDefault();
      targetBtn = document.querySelector('.calc-btn[data-action="operator"][data-val="÷"]');
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === '=' || key === 'Enter') {
      e.preventDefault();
      targetBtn = btnEquals;
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === 'Backspace') {
      targetBtn = document.querySelector('.calc-btn[data-action="backspace"]');
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
      targetBtn = btnAC;
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key.toLowerCase() === 's') {
      // Shortcut for square
      targetBtn = document.querySelector('.calc-btn[data-action="square"]');
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === '^') {
      targetBtn = document.querySelector('.calc-btn[data-action="cube"]');
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === '%') {
      targetBtn = document.querySelector('.calc-btn[data-action="percent"]');
      if (targetBtn) handleButtonAction(targetBtn, e);
    } else if (key === '(' || key === ')') {
      targetBtn = document.querySelector(`.calc-btn[data-action="parenthesis-${key === '(' ? 'open' : 'close'}"]`);
      if (targetBtn) handleButtonAction(targetBtn, e);
    }
  }

  // --- INITIALIZATION ---
  function init() {
    // Load preferences
    try {
      const savedTheme = localStorage.getItem('calc_theme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTheme('light');
      }

      const savedSound = localStorage.getItem('calc_sound');
      if (savedSound !== null) {
        setSound(savedSound === 'true');
      }
    } catch (e) {}

    loadHistory();
    updateDisplay();

    // Attach keypad click handlers
    keypadButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => handleButtonAction(btn, e));
    });

    // Inline backspace
    if (btnInlineBackspace) {
      btnInlineBackspace.addEventListener('click', (e) => {
        playKeySound('fn');
        handleBackspace();
      });
    }

    // Header buttons
    btnToggleSound.addEventListener('click', toggleSound);
    btnToggleTheme.addEventListener('click', toggleTheme);
    btnOpenHistory.addEventListener('click', openHistory);
    btnCloseHistory.addEventListener('click', closeHistory);
    btnClearHistory.addEventListener('click', clearHistory);
    btnToggleExtended.addEventListener('click', toggleExtendedRow);

    // Close history on background click
    historyDrawer.addEventListener('click', (e) => {
      if (e.target === historyDrawer) {
        closeHistory();
      }
    });

    // Keyboard support
    window.addEventListener('keydown', handleKeyboard);

    // Register Service Worker for 100% offline usage
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js')
          .then(() => {
            // Show brief offline ready toast
            if (offlinePill) {
              offlinePill.classList.add('show');
              setTimeout(() => {
                offlinePill.classList.remove('show');
              }, 2800);
            }
          })
          .catch((err) => {
            console.log('SW registration note:', err);
          });
      });
    }
  }

  // Start app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
