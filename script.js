/* Date Proposal — vanilla JavaScript version.
   Set window.DATE_PROPOSAL_API_BASE before this file loads if the API
   is served from another origin. */

(() => {
  "use strict";

  const API_BASE = String(window.DATE_PROPOSAL_API_BASE || "").replace(/\/$/, "");
  const ASSETS = "./assets/";
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MINUTES = ["00", "15", "30", "45"];
  const PRESET_VIBES = ["Movies 🎬", "Cafe ☕", "Park 🌿", "Activities 🎯", "Bookstore 📚"];
  const NO_MESSAGES = [
    "NOPE! 🙅",
    "Please Don't click this 😢",
    "Catch me if you can 🏃",
    "LMAO no 💀",
    "Just pick YES! 🙄",
    "I can do this all day 😎",
    "Please reconsider 🥺",
    "We'd be so cute together 💑",
    "I won't give up 💪",
    "Stubborn, aren't you? 😤",
    "Resistance is futile 🤖",
    "PLEASEEE?! 🙏",
  ];
  const POPUP_QUESTIONS = {
    1: "Are you sure? 😢",
    2: "Are you really sure? 🥺",
    3: "Like really really sure? 💔",
  };

  const state = {
    started: false,
    screen: "proposal",
    noCount: 0,
    hasFled: false,
    noPosition: null,
    popupStage: 0,
    cookedFlash: false,
    date: null,
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    hour: 7,
    minuteIndex: 0,
    ampm: "PM",
    vibes: [],
    customVibes: [],
    showCustomVibes: false,
    customInputs: ["", "", ""],
    outfitMatching: null,
    outfitColours: "",
    sharedProposal: null,
    shareId: null,
    shareLoading: false,
    shareError: false,
    linkState: "idle",
    linkCopied: false,
    copied: false,
    response: null,
    checking: false,
    transition: null,
  };

  const app = document.getElementById("app");
  let backgroundAudio = null;
  let transitionTimer = null;
  let countdownTimer = null;
  let messageTimer = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function playSound(filename, volume = 0.9) {
    const audio = new Audio(`${ASSETS}${filename}`);
    audio.volume = volume;
    audio.play().catch(() => {});
    return audio;
  }

  function startExperience() {
    if (state.started) return;
    backgroundAudio = new Audio(`${ASSETS}bgmusic.mp3`);
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.55;
    backgroundAudio.play().catch(() => {});
    state.started = true;
    render();
  }

  function toggleMusic() {
    if (!backgroundAudio) return;
    if (backgroundAudio.paused) {
      backgroundAudio.play().catch(() => {});
    } else {
      backgroundAudio.pause();
    }
    render();
  }

  function particlesMarkup() {
    const emojis = ["❤️", "🌸", "💕", "🌷", "💖", "🌺", "💗", "✨"];
    return `<div class="bg-layer" aria-hidden="true">${
      Array.from({ length: 22 }, (_, i) => {
        const left = 3 + (i * 4.3 + Math.sin(i * 1.7) * 8) % 94;
        const size = 12 + (i * 3.1) % 14;
        const duration = 9 + (i * 2.3) % 10;
        const delay = -(i * 1.9) % 18;
        const sway = ((i % 3) - 1) * (20 + (i * 7) % 30);
        const opacity = 0.22 + (i * 0.04) % 0.22;
        return `<span class="bg-particle" style="left:${left}%;font-size:${size}px;animation-duration:${duration}s;animation-delay:${delay}s;opacity:${opacity};--sway-x:${sway}px">${emojis[i % emojis.length]}</span>`;
      }).join("")
    }</div>`;
  }

  function transitionMarkup() {
    if (!state.transition) return "";
    const emojis = ["💕", "❤️", "🌸", "✨", "💖", "💗", "🌷", "🌺"];
    const parts = Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 20) * 360;
      const distance = 90 + (i * 17) % 100;
      const size = 16 + (i * 5) % 16;
      const delay = (i * 0.018) % 0.12;
      return `<span class="tr-particle" style="--angle:${angle}deg;--dist:${distance}px;font-size:${size}px;animation-delay:${delay}s">${emojis[i % emojis.length]}</span>`;
    }).join("");
    return `<div class="tr-overlay tr-overlay--${state.transition}"><div class="tr-center"><div class="tr-big-heart">💖</div>${parts}</div></div>`;
  }

  function welcomeMarkup() {
    if (state.started) return "";
    return `<div class="welcome-overlay"><div class="welcome-card">
      <div class="welcome-icon">🔊</div>
      <h2 class="welcome-title">Turn on sound for<br />better experience!</h2>
      <button class="btn btn-yes welcome-start-btn" data-action="start">START 🎵</button>
    </div></div>`;
  }

  function musicButtonMarkup() {
    if (!state.started) return "";
    const isOn = backgroundAudio && !backgroundAudio.paused;
    return `<button class="music-btn" data-action="music" title="${isOn ? "Mute music" : "Play music"}" aria-label="${isOn ? "Mute music" : "Play music"}">${isOn ? "🎵" : "🔇"}</button>`;
  }

  function dateText(date) {
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  function timeText() {
    return `${state.hour}:${MINUTES[state.minuteIndex]} ${state.ampm}`;
  }

  function moveTo(screen) {
    if (transitionTimer) clearTimeout(transitionTimer);
    state.transition = "in";
    render();
    transitionTimer = setTimeout(() => {
      state.screen = screen;
      state.transition = "out";
      render();
      transitionTimer = setTimeout(() => {
        state.transition = null;
        render();
      }, 500);
    }, 480);
  }

  function noLabel() {
    return NO_MESSAGES[Math.min(state.noCount, NO_MESSAGES.length - 1)];
  }

  function noUnlocked() {
    return state.noCount >= NO_MESSAGES.length - 1;
  }

  function noSubtitle() {
    if (state.noCount === 0) return "Pretty please? 🐻";
    if (state.noCount < 4) return "Come on... 🥺";
    if (state.noCount < 8) return "You can't catch that NO button 😂";
    if (noUnlocked()) return "Fine... you can click it now 😤";
    return "It's basically impossible now 😅";
  }

  function fleeNoButton() {
    if (noUnlocked()) return;
    const maxLeft = Math.max(24, window.innerWidth - 240 - 24);
    const maxTop = Math.max(24, window.innerHeight - 52 - 24);
    state.hasFled = true;
    state.noPosition = {
      x: 24 + Math.random() * Math.max(0, maxLeft - 24),
      y: 24 + Math.random() * Math.max(0, maxTop - 24),
    };
    state.noCount = Math.min(state.noCount + 1, NO_MESSAGES.length - 1);
    render();
  }

  function proposalMarkup() {
    const noButton = state.hasFled
      ? `<button class="btn btn-no${noUnlocked() ? " btn-no--unlocked" : ""}" data-action="no"${noUnlocked() ? "" : ' data-action-hover="flee"'} tabindex="${noUnlocked() ? "0" : "-1"}" style="position:fixed;left:${state.noPosition?.x ?? 0}px;top:${state.noPosition?.y ?? 0}px;transition:${noUnlocked() ? "none" : `left ${Math.max(0.04, 0.14 - state.noCount * 0.01)}s ease-out, top ${Math.max(0.04, 0.14 - state.noCount * 0.01)}s ease-out`}">${escapeHtml(noLabel())}</button>`
      : `<button class="btn btn-no" data-action="no" data-action-hover="flee" tabindex="-1">${escapeHtml(noLabel())}</button>`;

    return `<div class="page screen-enter">
      <div class="card">
        <img src="${ASSETS}eminem-rose.png" alt="A rose offered with the date proposal" class="bear-gif" />
        <h1 class="question">Would You Like To<br />Go On A Date With Me?</h1>
        <p class="sub">${escapeHtml(noSubtitle())}</p>
        <div class="btns-row">
          <button class="btn btn-yes" data-action="main-yes">Yes! 💖</button>
          ${state.hasFled ? "" : noButton}
        </div>
      </div>
      ${state.hasFled ? noButton : ""}
      ${state.cookedFlash ? `<div class="cooked-overlay"><div class="cooked-card">
        <video src="${ASSETS}cooked.mp4" autoplay playsinline loop class="cooked-video"></video>
        <p class="cooked-text">Damn I'm cooked 😢</p>
      </div></div>` : ""}
      ${state.popupStage > 0 ? popupMarkup() : ""}
    </div>`;
  }

  function popupMarkup() {
    const isFinal = state.popupStage === 4;
    const meme = state.popupStage === 3
      ? `<video src="${ASSETS}letmetell-video.mp4" autoplay playsinline loop class="popup-meme-gif"></video>`
      : "";
    return `<div class="overlay" data-action="${isFinal ? "" : "dismiss-popup"}">
      <div class="popup${state.popupStage === 3 ? " popup--meme" : ""}" data-popup-content>
        ${isFinal
          ? `<p class="popup-final">I've reviewed all available options and, going on a date with me is the best one. 💅</p>
             <button class="btn btn-yes" data-action="final-back">Take me back 🏠</button>`
          : `${meme}<p class="popup-question">${POPUP_QUESTIONS[state.popupStage]}</p>
             <div class="popup-btns">
               <button class="btn btn-popup-yes" data-action="popup-yes">Yes 😬</button>
               <button class="btn btn-popup-no" data-action="popup-no">No 😌</button>
             </div>`}
      </div>
    </div>`;
  }

  function calendarMarkup() {
    const year = state.calendarYear;
    const month = state.calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const now = new Date();
    let cells = Array(firstDay).fill('<span aria-hidden="true"></span>').join("");
    for (let day = 1; day <= daysCount; day += 1) {
      const date = new Date(year, month, day);
      const past = new Date(year, month, day).setHours(0, 0, 0, 0) < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const today = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
      const selected = state.date && day === state.date.getDate() && month === state.date.getMonth() && year === state.date.getFullYear();
      const classes = [
        "cal-day",
        today ? "cal-day--today" : "",
        selected ? "cal-day--selected" : "",
        past ? "cal-day--past" : "",
      ].filter(Boolean).join(" ");
      cells += `<button class="${classes}" data-action="select-date" data-day="${day}" ${past ? "disabled" : ""}>${day}</button>`;
    }
    const totalCells = firstDay + daysCount;
    const blankTail = (7 - (totalCells % 7)) % 7;
    cells += Array(blankTail).fill('<span aria-hidden="true"></span>').join("");
    const minute = MINUTES[state.minuteIndex];
    return `<div class="page dp-page screen-enter"><div class="dp-card">
      <h1 class="dp-title">So... When Are You Free? 📅</h1>
      <div class="cal-header">
        <button class="cal-nav" data-action="previous-month" aria-label="Previous month">‹</button>
        <span class="cal-month-label">${MONTHS[month]} ${year}</span>
        <button class="cal-nav" data-action="next-month" aria-label="Next month">›</button>
      </div>
      <div class="cal-grid">${WEEKDAYS.map((day) => `<div class="cal-day-name">${day}</div>`).join("")}${cells}</div>
      <div class="time-section">
        <p class="time-label">🚗💨 What time you want me to pick you up cutie? 🥰</p>
        <div class="spinner-row">
          ${spinnerMarkup("hour", String(state.hour), "hour")}
          <div class="spinner-colon">:</div>
          ${spinnerMarkup("minute", minute, "min")}
          ${spinnerMarkup("ampm", state.ampm, "am/pm")}
        </div>
      </div>
      ${state.date ? `<p class="dp-preview">📅 ${dateText(state.date)} · 🕐 ${state.hour}:${minute} ${state.ampm}</p>` : ""}
      <button class="btn btn-confirm${state.date ? "" : " btn-confirm--disabled"}" data-action="confirm-date" ${state.date ? "" : "disabled"}>${state.date ? "Next ➜" : "Pick a date first 📅"}</button>
    </div></div>`;
  }

  function spinnerMarkup(which, value, label) {
    return `<div class="spinner-col">
      <button class="spinner-arrow" data-action="spinner-up" data-spinner="${which}" aria-label="Increase ${label}">▲</button>
      <div class="spinner-value">${value}</div>
      <button class="spinner-arrow" data-action="spinner-down" data-spinner="${which}" aria-label="Decrease ${label}">▼</button>
      <span class="spinner-label">${label}</span>
    </div>`;
  }

  function customVibesModal() {
    if (!state.showCustomVibes) return "";
    return `<div class="overlay" data-action="close-custom-modal">
      <div class="popup others-popup" data-popup-content>
        <p class="popup-question" style="margin-bottom:6px">Please Specify ✏️</p>
        <p class="others-hint">Add up to 3 ideas</p>
        <div class="others-inputs">
          ${state.customInputs.map((value, index) => `<input class="others-input" type="text" data-custom-input="${index}" placeholder="Option ${index + 1}" value="${escapeHtml(value)}" maxlength="40" />`).join("")}
        </div>
        <div class="popup-btns">
          <button class="btn btn-popup-yes" data-action="save-custom">Save ✓</button>
          <button class="btn btn-popup-no" data-action="cancel-custom">Cancel</button>
        </div>
      </div>
    </div>`;
  }

  function vibesMarkup() {
    const selected = (vibe) => state.vibes.includes(vibe) || (vibe === "__others__" && state.customVibes.length > 0);
    const customTags = state.customVibes.length
      ? `<div class="others-tags">${state.customVibes.map((idea) => `<span class="others-tag">${escapeHtml(idea)}</span>`).join("")}</div>`
      : "";
    const choices = PRESET_VIBES.map((vibe) => `<button class="vibe-btn${selected(vibe) ? " vibe-btn--active" : ""}" data-action="toggle-vibe" data-vibe="${escapeHtml(vibe)}">${escapeHtml(vibe)}</button>`).join("");
    const othersLabel = state.customVibes.length ? `Others ✏️ (${state.customVibes.length})` : "Others ✨";
    const hasAny = state.vibes.length > 0 || state.customVibes.length > 0;
    return `<div class="page vp-page screen-enter"><div class="vp-card">
      <h1 class="dp-title">What Are We Feeling? 🌟</h1>
      <p class="vp-sub">(you can pick more than one btw)</p>
      <div class="vibes-grid">${choices}<button class="vibe-btn${selected("__others__") ? " vibe-btn--active" : ""}" data-action="open-custom">${othersLabel}</button></div>
      ${customTags}
      <button class="btn btn-confirm${hasAny ? "" : " btn-confirm--disabled"}" data-action="confirm-vibes" ${hasAny ? "" : "disabled"}>${hasAny ? "Lock it in! 💘" : "Pick at least one!"}</button>
    </div>${customVibesModal()}</div>`;
  }

  function outfitMarkup() {
    const canContinue = state.outfitMatching !== null && (!state.outfitMatching || state.outfitColours.trim().length > 0);
    return `<div class="page vp-page screen-enter"><div class="vp-card">
      <div class="outfit-emoji">👗💑👔</div>
      <h1 class="dp-title" style="font-size:1.3rem">Wanna be that cute couple<br />that match outfits?</h1>
      <div class="outfit-yesno">
        <button class="outfit-choice-btn${state.outfitMatching === true ? " outfit-choice-btn--yes-active" : ""}" data-action="outfit-yes">Yes! 💖</button>
        <button class="outfit-choice-btn${state.outfitMatching === false ? " outfit-choice-btn--no-active" : ""}" data-action="outfit-no">Nah 😅</button>
      </div>
      ${state.outfitMatching === true ? `<div class="colours-section">
        <label class="colours-label" for="outfit-colours">🎨 Colours of Choice?</label>
        <input class="colours-input" id="outfit-colours" type="text" placeholder="e.g. blush pink & white, all black..." value="${escapeHtml(state.outfitColours)}" maxlength="80" />
      </div>` : ""}
      ${state.outfitMatching === false ? "<p class=\"outfit-nah-msg\">No worries, you'll still look amazing! ✨</p>" : ""}
      <button class="btn btn-confirm${canContinue ? "" : " btn-confirm--disabled"}" data-action="confirm-outfit" ${canContinue ? "" : "disabled"} style="margin-top:${state.outfitMatching === null ? "24px" : "16px"}">${canContinue ? "Almost there! ➜" : "Make a choice above first 👆"}</button>
    </div></div>`;
  }

  function confirmedMarkup() {
    const matching = state.outfitMatching === true;
    return `<div class="yes-screen screen-enter"><div class="yes-content">
      <div class="confirmed-emoji">🗓️💕</div>
      <h1 class="yes-title" style="font-size:2rem">It's a Date! 🎉</h1>
      <p class="confirmed-message">I'll be at your door at <strong>${timeText()}</strong> on <strong>${dateText(state.date)}</strong>, can't wait to see you 😊❤️</p>
      ${state.vibes.length ? `<div class="confirmed-vibes">${state.vibes.map((vibe) => `<span class="confirmed-vibe-tag">${escapeHtml(vibe)}</span>`).join("")}</div>` : ""}
      ${state.outfitMatching !== null ? `<div class="confirmed-outfit">
        <span class="confirmed-vibe-tag">${matching ? "👗 Matching outfits!" : "👍 No matching needed"}</span>
        ${matching && state.outfitColours.trim() ? `<span class="confirmed-vibe-tag">🎨 ${escapeHtml(state.outfitColours.trim())}</span>` : ""}
      </div>` : ""}
      <button class="btn btn-next" data-action="make-date-card" style="margin-top:20px">Make a date card 🗂️</button>
    </div></div>`;
  }

  function makeShareMessage() {
    return [
      "🗓️ It's a date!",
      `📅 ${dateText(state.date)}`,
      `🕐 ${timeText()}`,
      state.vibes.length ? `✨ Vibes: ${state.vibes.join(", ")}` : "",
      state.outfitMatching ? `👗 We're matching${state.outfitColours.trim() ? ` (${state.outfitColours.trim()})` : ""}!` : "",
      "",
      "Can't wait to see you 😊❤️",
    ].filter((line, index) => line !== "" || index === 5).join("\n");
  }

  function countdownMarkup() {
    const target = new Date(state.date.getFullYear(), state.date.getMonth(), state.date.getDate());
    const [hourText, minuteText] = timeText().split(":");
    let hour = Number(hourText);
    const [, rest] = timeText().split(":");
    const ampm = rest.trim().slice(-2);
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    target.setHours(hour, Number(minuteText.slice(0, 2)), 0, 0);
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return '<p class="countdown-past">🎉 The date is happening right now!!</p>';
    const total = Math.floor(diff / 1000);
    const values = [
      [Math.floor(total / 86400), "days"],
      [String(Math.floor((total % 86400) / 3600)).padStart(2, "0"), "hrs"],
      [String(Math.floor((total % 3600) / 60)).padStart(2, "0"), "min"],
      [String(total % 60).padStart(2, "0"), "sec"],
    ];
    return `<div class="countdown" id="countdown">
      <p class="countdown-label">⏳ Time until our date</p>
      <div class="countdown-tiles">${values.map(([value, label], index) => `${index ? '<span class="countdown-sep">:</span>' : ""}<div class="countdown-tile"><span class="countdown-num" data-countdown-value="${label}">${value}</span><span class="countdown-unit">${label}</span></div>`).join("")}</div>
    </div>`;
  }

  function shareStatusMarkup() {
    if (state.response === "yes") return '<p class="response-label response-label--yes">🎉 They said YES!!</p>';
    if (state.response === "no") return '<p class="response-label response-label--no">💔 They said no…</p>';
    return '<p class="response-label response-label--pending">⏳ Waiting for their reply…</p>';
  }

  function dateCardMarkup() {
    const shareUrl = state.shareId
      ? `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(state.shareId)}`
      : "";
    return `<div class="yes-screen screen-enter"><div class="yes-content datecard-content">
      <div class="datecard">
        <div class="datecard-header"><span class="datecard-hearts">💕</span><h2 class="datecard-title">Our Date 🗓️</h2><span class="datecard-hearts">💕</span></div>
        <div class="datecard-row"><span class="datecard-icon">📅</span><div><div class="datecard-label">Date</div><div class="datecard-value">${dateText(state.date)}</div></div></div>
        <div class="datecard-row"><span class="datecard-icon">🕐</span><div><div class="datecard-label">Pick-up time</div><div class="datecard-value">${timeText()}</div></div></div>
        ${state.vibes.length ? `<div class="datecard-row"><span class="datecard-icon">✨</span><div><div class="datecard-label">Vibes</div><div class="datecard-tags">${state.vibes.map((vibe) => `<span class="datecard-tag">${escapeHtml(vibe)}</span>`).join("")}</div></div></div>` : ""}
        ${state.outfitMatching !== null ? `<div class="datecard-row"><span class="datecard-icon">👗</span><div><div class="datecard-label">Outfits</div><div class="datecard-value">${state.outfitMatching ? `Matching${state.outfitColours.trim() ? ` · ${escapeHtml(state.outfitColours.trim())}` : ""}` : "No matching needed"}</div></div></div>` : ""}
        <p class="datecard-footer">Can't wait to see you 😊❤️</p>
        ${countdownMarkup()}
      </div>
      <div class="datecard-actions">
        <button class="btn datecard-btn-copy" data-action="copy-message">${state.copied ? "✅ Copied!" : "📋 Copy Message"}</button>
        ${state.linkState === "idle" ? '<button class="btn datecard-btn-link" data-action="create-link">🔗 Create Shareable Link</button>' : ""}
        ${state.linkState === "loading" ? '<button class="btn datecard-btn-link" disabled>⏳ Generating…</button>' : ""}
        ${state.linkState === "error" ? '<button class="btn datecard-btn-link" data-action="create-link">⚠️ Retry Link</button>' : ""}
        ${state.linkState === "done" && shareUrl ? `<div class="sharelink-box">
          <p class="sharelink-label">Send this link to your date 💌</p>
          <div class="sharelink-row"><span class="sharelink-url">${escapeHtml(shareUrl)}</span><button class="btn sharelink-copy-btn" data-action="copy-link">${state.linkCopied ? "✅" : "📋"}</button></div>
          <div class="sharelink-response">${shareStatusMarkup()}<button class="btn sharelink-check-btn" data-action="check-response" ${state.checking ? "disabled" : ""}>${state.checking ? "⏳" : "🔄 Check"}</button></div>
        </div>` : ""}
      </div>
    </div></div>`;
  }

  function shareProposalMarkup() {
    if (state.shareLoading) return '<div class="page screen-enter"><div class="card"><p class="yes-sub">Loading your surprise… 🎀</p></div></div>';
    if (state.shareError || !state.sharedProposal) return "<div class=\"page screen-enter\"><div class=\"card\"><p class=\"yes-sub\">Hmm, couldn't find this proposal 😔</p></div></div>";
    return `<div class="page screen-enter"><div class="card">
      <img src="${ASSETS}eminem-rose.png" alt="A rose offered with the date proposal" class="bear-gif" />
      <h1 class="question">Would You Like To<br />Go On A Date With Me?</h1>
      <p class="sub">Pretty please? 🌹</p>
      <div class="btns-row"><button class="btn btn-yes" data-action="share-yes">Yes! 💖</button><button class="btn btn-no btn-no--unlocked" data-action="share-no">No 😔</button></div>
    </div></div>`;
  }

  function shareYesMarkup() {
    const proposal = state.sharedProposal;
    if (!proposal) return "";
    return `<div class="yes-screen screen-enter"><div class="yes-content">
      <div class="confirmed-emoji">🎉💕</div><h1 class="yes-title">YAY!!</h1>
      <p class="confirmed-message">It's a date! I'll pick you up at <strong>${escapeHtml(proposal.timeStr)}</strong> on <strong>${escapeHtml(proposal.dateStr)}</strong> 😊❤️</p>
      ${proposal.vibes?.length ? `<div class="confirmed-vibes">${proposal.vibes.map((vibe) => `<span class="confirmed-vibe-tag">${escapeHtml(vibe)}</span>`).join("")}</div>` : ""}
      ${proposal.outfitMatching ? `<div class="confirmed-outfit"><span class="confirmed-vibe-tag">👗 Matching outfits${proposal.outfitColours ? ` · ${escapeHtml(proposal.outfitColours)}` : ""}!</span></div>` : ""}
    </div></div>`;
  }

  function shareNoMarkup() {
    return `<div class="yes-screen screen-enter" style="background:linear-gradient(135deg,#f5f5f5,#e8e8e8,#d5d5d5)"><div class="yes-content">
      <div class="confirmed-emoji">😔</div><h1 class="yes-title" style="font-size:2rem;color:#888">Maybe next time…</h1><p class="yes-sub" style="color:#aaa">That's okay 🤍</p>
    </div></div>`;
  }

  function celebrationMarkup() {
    return `<div class="yes-screen screen-enter"><div class="yes-content">
      <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmZhMWViZTUxZGFhZjM4NzZiZTFhMjM5YWYwMGM0ZGE5Nzk1YzM3ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MDJ9IbxxvDUQM/giphy.gif" alt="Cat kissing gif" class="yes-gif" />
      <h1 class="yes-title">Yay! 🎉</h1><p class="yes-sub">I knew you'd say yes! 💕</p>
      <button class="btn btn-next" data-action="next-date">Next ➜</button>
    </div></div>`;
  }

  function screenMarkup() {
    switch (state.screen) {
      case "share-proposal": return shareProposalMarkup();
      case "share-yes": return shareYesMarkup();
      case "share-no": return shareNoMarkup();
      case "celebration": return celebrationMarkup();
      case "datepicker": return calendarMarkup();
      case "vibes": return vibesMarkup();
      case "outfit": return outfitMarkup();
      case "confirmed": return state.date ? confirmedMarkup() : proposalMarkup();
      case "datecard": return state.date ? dateCardMarkup() : proposalMarkup();
      case "proposal":
      default: return proposalMarkup();
    }
  }

  function render() {
    if (!app) return;
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    app.innerHTML = `${particlesMarkup()}${screenMarkup()}${transitionMarkup()}${musicButtonMarkup()}${welcomeMarkup()}`;
    if (state.screen === "datecard" && state.date) {
      countdownTimer = setInterval(updateCountdown, 1000);
    }
  }

  function updateCountdown() {
    if (!state.date || state.screen !== "datecard") return;
    const date = new Date(state.date.getFullYear(), state.date.getMonth(), state.date.getDate());
    const timeParts = timeText().split(":");
    const hour = Number(timeParts[0]);
    const minuteAndPeriod = timeParts[1].trim().split(" ");
    let hour24 = hour;
    if (minuteAndPeriod[1] === "PM" && hour !== 12) hour24 += 12;
    if (minuteAndPeriod[1] === "AM" && hour === 12) hour24 = 0;
    date.setHours(hour24, Number(minuteAndPeriod[0]), 0, 0);
    const diff = date.getTime() - Date.now();
    const container = document.getElementById("countdown");
    if (diff <= 0) {
      if (!document.querySelector(".countdown-past")) {
        container?.insertAdjacentHTML("afterend", '<p class="countdown-past">🎉 The date is happening right now!!</p>');
        container?.remove();
      }
      return;
    }
    const total = Math.floor(diff / 1000);
    const values = {
      days: Math.floor(total / 86400),
      hrs: String(Math.floor((total % 86400) / 3600)).padStart(2, "0"),
      min: String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
      sec: String(total % 60).padStart(2, "0"),
    };
    Object.entries(values).forEach(([key, value]) => {
      const element = document.querySelector(`[data-countdown-value="${key}"]`);
      if (element) element.textContent = String(value);
    });
  }

  function shiftMonth(delta) {
    const next = new Date(state.calendarYear, state.calendarMonth + delta, 1);
    state.calendarYear = next.getFullYear();
    state.calendarMonth = next.getMonth();
    render();
  }

  function toggleVibe(vibe) {
    if (state.vibes.includes(vibe)) {
      state.vibes = state.vibes.filter((item) => item !== vibe);
    } else {
      state.vibes = [...state.vibes, vibe];
    }
    render();
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Use the fallback below for browsers without clipboard permissions.
    }
    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    field.remove();
    return copied;
  }

  function flashCopyState(property) {
    state[property] = true;
    render();
    if (messageTimer) clearTimeout(messageTimer);
    messageTimer = setTimeout(() => {
      state[property] = false;
      render();
    }, 2200);
  }

  async function createShareLink() {
    state.linkState = "loading";
    render();
    try {
      const response = await fetch(`${API_BASE}/api/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateStr: dateText(state.date),
          timeStr: timeText(),
          vibes: state.vibes,
          outfitMatching: state.outfitMatching === true,
          outfitColours: state.outfitColours.trim(),
        }),
      });
      if (!response.ok) throw new Error("Unable to create a proposal link.");
      const result = await response.json();
      state.shareId = result.id;
      state.linkState = "done";
    } catch {
      state.linkState = "error";
    }
    render();
  }

  async function fetchProposal(id) {
    state.shareLoading = true;
    state.screen = "share-proposal";
    render();
    try {
      const response = await fetch(`${API_BASE}/api/proposals/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error("Proposal not found.");
      state.sharedProposal = await response.json();
      state.shareError = false;
    } catch {
      state.shareError = true;
    } finally {
      state.shareLoading = false;
      render();
    }
  }

  async function recordResponse(responseValue) {
    if (!state.shareId) return;
    try {
      await fetch(`${API_BASE}/api/proposals/${encodeURIComponent(state.shareId)}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseValue }),
      });
    } catch {
      // The recipient still sees their answer even if the API is unavailable.
    }
  }

  async function checkResponse() {
    if (!state.shareId) return;
    state.checking = true;
    render();
    try {
      const response = await fetch(`${API_BASE}/api/proposals/${encodeURIComponent(state.shareId)}`);
      if (!response.ok) throw new Error("Unable to check response.");
      const proposal = await response.json();
      state.response = proposal.response ?? null;
    } catch {
      // Keep the last known response visible.
    } finally {
      state.checking = false;
      render();
    }
  }

  function handleAction(action, element, clickEvent) {
    switch (action) {
      case "start":
        startExperience();
        break;
      case "music":
        toggleMusic();
        break;
      case "main-yes":
        playSound("yes_main.mp3");
        moveTo("celebration");
        break;
      case "no":
        if (!noUnlocked()) return;
        state.cookedFlash = true;
        render();
        setTimeout(() => {
          state.cookedFlash = false;
          state.popupStage = 1;
          render();
        }, 1600);
        break;
      case "popup-yes":
        playSound("fah.mp3");
        state.popupStage = Math.min(state.popupStage + 1, 4);
        render();
        break;
      case "popup-no":
        state.popupStage = 0;
        render();
        break;
      case "dismiss-popup":
        if (state.popupStage < 4 && element === clickEvent.target) {
          state.popupStage = 0;
          render();
        }
        break;
      case "final-back":
        state.popupStage = 0;
        state.noCount = 0;
        state.hasFled = false;
        state.noPosition = null;
        render();
        break;
      case "next-date":
        state.calendarYear = new Date().getFullYear();
        state.calendarMonth = new Date().getMonth();
        moveTo("datepicker");
        break;
      case "previous-month":
        shiftMonth(-1);
        break;
      case "next-month":
        shiftMonth(1);
        break;
      case "select-date": {
        const day = Number(element.dataset.day);
        state.date = new Date(state.calendarYear, state.calendarMonth, day);
        render();
        break;
      }
      case "spinner-up":
      case "spinner-down": {
        const up = action === "spinner-up";
        const spinner = element.dataset.spinner;
        if (spinner === "hour") state.hour = up ? (state.hour === 12 ? 1 : state.hour + 1) : (state.hour === 1 ? 12 : state.hour - 1);
        if (spinner === "minute") state.minuteIndex = up ? (state.minuteIndex + 1) % MINUTES.length : (state.minuteIndex - 1 + MINUTES.length) % MINUTES.length;
        if (spinner === "ampm") state.ampm = state.ampm === "AM" ? "PM" : "AM";
        render();
        break;
      }
      case "confirm-date":
        if (state.date) moveTo("vibes");
        break;
      case "toggle-vibe":
        toggleVibe(element.dataset.vibe);
        break;
      case "open-custom":
        state.customInputs = [...state.customVibes, "", ""].slice(0, 3);
        while (state.customInputs.length < 3) state.customInputs.push("");
        state.showCustomVibes = true;
        render();
        break;
      case "save-custom":
        state.customVibes = state.customInputs.map((value) => value.trim()).filter(Boolean);
        state.showCustomVibes = false;
        render();
        break;
      case "cancel-custom":
        state.showCustomVibes = false;
        render();
        break;
      case "close-custom-modal":
        if (element === clickEvent.target) {
          state.showCustomVibes = false;
          render();
        }
        break;
      case "confirm-vibes":
        if (state.vibes.length || state.customVibes.length) {
          state.vibes = [...state.vibes.filter((vibe) => vibe !== "__others__"), ...state.customVibes];
          moveTo("outfit");
        }
        break;
      case "outfit-yes":
        state.outfitMatching = true;
        render();
        break;
      case "outfit-no":
        state.outfitMatching = false;
        state.outfitColours = "";
        render();
        break;
      case "confirm-outfit":
        if (state.outfitMatching !== null && (!state.outfitMatching || state.outfitColours.trim())) {
          moveTo("confirmed");
        }
        break;
      case "make-date-card":
        state.linkState = "idle";
        state.shareId = null;
        state.response = null;
        moveTo("datecard");
        break;
      case "copy-message":
        copyText(makeShareMessage()).then((success) => {
          if (success) flashCopyState("copied");
        });
        break;
      case "create-link":
        createShareLink();
        break;
      case "copy-link":
        if (state.shareId) {
          const url = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(state.shareId)}`;
          copyText(url).then((success) => {
            if (success) flashCopyState("linkCopied");
          });
        }
        break;
      case "check-response":
        checkResponse();
        break;
      case "share-yes":
        playSound("yes_main.mp3");
        recordResponse("yes").finally(() => moveTo("share-yes"));
        break;
      case "share-no":
        recordResponse("no").finally(() => moveTo("share-no"));
        break;
      default:
        break;
    }
  }

  app.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action) handleAction(action, button, event);
  });

  app.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.matches("[data-custom-input]")) {
      state.customInputs[Number(target.dataset.customInput)] = target.value;
    } else if (target.id === "outfit-colours") {
      state.outfitColours = target.value;
      const selectionStart = target.selectionStart;
      render();
      const replacement = document.getElementById("outfit-colours");
      replacement?.focus();
      replacement?.setSelectionRange(selectionStart, selectionStart);
    }
  });

  app.addEventListener("pointerover", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('[data-action-hover="flee"]');
    if (!button || (event.relatedTarget instanceof Node && button.contains(event.relatedTarget))) return;
    fleeNoButton();
  });

  app.addEventListener("focusin", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-action-hover="flee"]')) fleeNoButton();
  });

  const shareId = new URLSearchParams(window.location.search).get("share");
  render();
  if (shareId) {
    state.shareId = shareId;
    fetchProposal(shareId);
  }
})();
