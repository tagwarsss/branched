/* ===== Supabase Connection ===== */
/* ===== Supabase Connection ===== */

const SUPABASE_URL = "https://rvyrpzuvwapwxpobicfb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eXJwenV2d2Fwd3hwb2JpY2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjIyNzEsImV4cCI6MjEwMzQ5ODI3MX0.9dysuEyVyc-jL27bSQs9YibqeuUqlUb2VyQrL2L4QWQ";


/* ===== Last processed database ID ===== */

let lastMessageId = 0;


/* ===== Fetch initial messages ===== */

async function fetchMessages() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?select=id,name,message&order=id.asc`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      console.error("Supabase fetch failed:", response.status);
      return [];
    }

    const data = await response.json();

    return data;

  } catch (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }
}


/* ===== Check for new rows ===== */

async function pollMessages() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?select=id,message&order=id.asc&id=gt.${lastMessageId}`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      console.error("Supabase polling failed:", response.status);
      return;
    }

    const data = await response.json();

    if (!data.length) return;

    /* ---- Add every new database row ---- */

    const newMessages = [];

    data.forEach((row) => {
      if (row.message) {
        newMessages.push(row.message);
      }

      /* ---- Remember the newest ID ---- */

      if (Number(row.id) > lastMessageId) {
        lastMessageId = Number(row.id);
      }
    });

    if (newMessages.length) {
      addWordsToBackground(newMessages);
    }

    refreshChatPanel();

  } catch (error) {
    console.error("Supabase polling error:", error);
  }
}


/* ===== Add messages to background ===== */

function addWordsToBackground(words) {
  const bg = document.querySelector(".background");

  if (!bg) return;

  const frag = document.createDocumentFragment();

  const existingCount =
    bg.querySelectorAll(".bg-word").length;

  words.forEach((msg) => {

    const span = document.createElement("span");

    span.className = "bg-word";

    const fontSize =
      Math.floor(14 + Math.random() * 36);

    const blur = (Math.random() * 2).toFixed(1);
    let finalOpacity = (0.2 + Math.random() * 0.4).toFixed(2);

    // Center zone: reduce opacity to avoid competing with sketch
    const centerX = 5 + Math.random() * 90;
    const centerY = 5 + Math.random() * 90;
    if (centerX > 30 && centerX < 70 && centerY > 30 && centerY < 70) {
      finalOpacity = (parseFloat(finalOpacity) * 0.5).toFixed(2);
    }

    span.style.cssText = `
      position:absolute;
      left:${centerX}%;
      top:${centerY}%;
      transform:translate(-50%,-50%);
      color:#fff;
      font-size:${fontSize}px;
      opacity:0;
      filter:blur(${blur}px);
      transition:opacity 30s ease;
      white-space:nowrap;
    `;

    span.dataset.finalOpacity = finalOpacity;

    span.textContent = msg;

    frag.appendChild(span);
  });

  bg.appendChild(frag);

  requestAnimationFrame(() => {

    const allWords =
      bg.querySelectorAll(".bg-word");

    for (
      let i = existingCount;
      i < allWords.length;
      i++
    ) {

      allWords[i].style.transitionDelay =
        `${(i - existingCount) * 2}s`;

      allWords[i].style.opacity = allWords[i].dataset.finalOpacity || "0.45";
    }

  });

}

/* ===== Refresh chat panel with all messages ===== */

async function refreshChatPanel(show = false) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  chatMessages.innerHTML = "";

  if (!show) return;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?select=name,message&order=id.asc`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) return;

    const data = await response.json();

    data.forEach((row) => {
      if (!row.message) return;

      const div = document.createElement("div");
      div.className = "chat-message received";

      const nameSpan = document.createElement("span");
      nameSpan.className = "msg-name";
      nameSpan.textContent = (row.name || "Anonymous") + ":";

      const msgSpan = document.createElement("span");
      msgSpan.className = "msg-text";
      msgSpan.textContent = row.message;

      div.appendChild(nameSpan);
      div.appendChild(msgSpan);
      chatMessages.appendChild(div);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;

  } catch (error) {
    console.error("refreshChatPanel error:", error);
  }
}


/* ===== Render messages list in About section ===== */

function renderMessagesList(messages) {
  const container = document.getElementById("messagesList");
  if (!container) return;

  container.innerHTML = "";

  messages.forEach((row) => {
    if (!row.message) return;

    const item = document.createElement("div");
    item.className = "message-item";

    const name = document.createElement("span");
    name.className = "message-name";
    name.textContent = row.name || "Anonymous";

    const msg = document.createElement("span");
    msg.className = "message-text";
    msg.textContent = row.message;

    item.appendChild(name);
    item.appendChild(msg);
    container.appendChild(item);
  });
}


/* ===== Initial load ===== */

(async function init() {

  const messages = await fetchMessages();

  renderMessagesList(messages);

  /* ---- Display existing messages ---- */

  if (messages.length) {

    const bg = document.querySelector(".background");

    const frag = document.createDocumentFragment();

    messages.forEach((row) => {

      const msg = row.message;

      if (!msg) return;

      const span = document.createElement("span");

      const fontSize =
        Math.floor(14 + Math.random() * 36);

      const blur = (Math.random() * 5).toFixed(1);
      const finalOpacity = Math.random() < 0.3
        ? (0.05 + Math.random() * 0.1).toFixed(2)
        : (0.2 + Math.random() * 0.6).toFixed(2);

      span.className = "bg-word";

      span.style.cssText = `
        position:absolute;
        left:${-5 + Math.random() * 110}%;
        top:${-5 + Math.random() * 110}%;
        transform:translate(-50%,-50%);
        color:#fff;
        font-size:${fontSize}px;
        opacity:0;
        filter:blur(${blur}px);
        transition:opacity 5s ease;
      white-space:nowrap;
    `;

      span.dataset.finalOpacity = finalOpacity;

      span.textContent = msg;

      frag.appendChild(span);

      /* ---- Remember newest ID ---- */

      if (Number(row.id) > lastMessageId) {
        lastMessageId = Number(row.id);
      }

    });

    bg.appendChild(frag);

    requestAnimationFrame(() => {

      const allWords =
        bg.querySelectorAll(".bg-word");

      allWords.forEach((span, i) => {

        span.style.transitionDelay =
          `${0.3 + (i % 60) * 0.015}s`;

        span.style.opacity = span.dataset.finalOpacity || "0.45";

      });

    });

  } else {

    /* ---- Still reveal background if database is empty ---- */

    const bg = document.querySelector(".background");

    if (bg) {
      bg.classList.add("reveal");
    }

  }

  /* ===== Check database every 5 seconds ===== */

  setInterval(pollMessages, 5000);

})();

/* ===== Paper drag-to-scroll ===== */
(function () {
  const paper = document.getElementById("paperMessages");
  const list = document.getElementById("messagesList");
  if (!paper || !list) return;

  let isDragging = false;
  let hasDragged = false;
  const DRAG_THRESHOLD = 5;
  let startY = 0;
  let currentScroll = 0;
  let targetScroll = 0;
  let scrollVelocity = 0;
  let lastMoveY = 0;
  let lastMoveTime = 0;
  let rafId = null;

  const ROW_HEIGHT = 32;
  const VISIBLE_ROWS = 10;
  const SMOOTH = 0.2;
  const FRICTION = 0.92;
  const MOMENTUM_MIN = 0.5;

  const getMaxScroll = () => {
    const totalRows = list.children.length;
    return Math.max(0, (totalRows - VISIBLE_ROWS) * ROW_HEIGHT);
  };

  const setTransform = () => {
    list.style.transform = `translate3d(0, ${-currentScroll}px, 0)`;
  };

  const lerp = (a, b, t) => a + (b - a) * t;

  const tick = () => {
    if (!isDragging) {
      scrollVelocity *= FRICTION;

      const maxScroll = getMaxScroll();
      targetScroll += scrollVelocity * 16;

      if (targetScroll < 0) {
        targetScroll += (0 - targetScroll) * 0.2;
        scrollVelocity *= 0.5;
      } else if (targetScroll > maxScroll) {
        targetScroll += (maxScroll - targetScroll) * 0.2;
        scrollVelocity *= 0.5;
      }

      if (Math.abs(scrollVelocity) < MOMENTUM_MIN) {
        scrollVelocity = 0;
      }
    }

    currentScroll = lerp(currentScroll, targetScroll, SMOOTH);
    setTransform();

    const d = Math.abs(targetScroll - currentScroll);

    if (isDragging || Math.abs(scrollVelocity) > MOMENTUM_MIN || d > 0.01) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  };

  const ensureTick = () => {
    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  const onPointerDown = (e) => {
    isDragging = true;
    hasDragged = false;
    scrollVelocity = 0;

    startY = e.clientY;
    lastMoveY = startY;
    lastMoveTime = performance.now();

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    targetScroll = currentScroll;

    paper.style.cursor = "grabbing";
    paper.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;

    const now = performance.now();
    const dy = startY - e.clientY;

    if (Math.abs(dy) > DRAG_THRESHOLD) {
      hasDragged = true;
    }

    const dt = now - lastMoveTime;
    if (dt > 0) {
      scrollVelocity = (e.clientY - lastMoveY) / dt * -1;
    }
    lastMoveY = e.clientY;
    lastMoveTime = now;

    const maxScroll = getMaxScroll();
    targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + dy));
    startY = e.clientY;

    ensureTick();
  };

  const onPointerUp = () => {
    isDragging = false;
    paper.style.cursor = "grab";
    ensureTick();
  };

  paper.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
})();

/* ---- Center text fade-in ---- */
const txtElement = document.querySelector(".txt");
const message = txtElement.textContent.trim();
txtElement.style.opacity = "1";
txtElement.textContent = "";

[ ...message ].forEach((char) => {
  const span = document.createElement("span");
  span.textContent = char;
  span.style.animationDelay = `${(Math.random() * 1.5).toFixed(2)}s`;
  span.style.display = char === " " ? "inline-block" : "inline";
  txtElement.appendChild(span);
});

/* ---- Reveal sketch + fade the text out ~4s after the text transition in ---- */
const sketch = document.querySelector(".sketch");
const textDuration = 2000;
const showHold = 5000;

setTimeout(() => {
  sketch.classList.add("reveal");
  const nav = document.querySelector(".nav-bar");
  if (nav) nav.classList.add("reveal");
  const envelopeBtn = document.querySelector(".envelope-btn");
  if (envelopeBtn) envelopeBtn.classList.add("reveal");
  const bg = document.querySelector(".background");
  if (bg) {
    bg.classList.add("reveal");
  }
  txtElement.style.transition = "opacity 0.8s ease";
  txtElement.style.opacity = 0;
}, textDuration + showHold);

/* ===== Top navigation bar ===== */
(function () {
  const nav = document.querySelector(".nav-bar");
  if (!nav) return;
  const items = [...nav.querySelectorAll(".nav-item")];
  if (items.length === 0) return;

  const goTo = (value) => {
    items.forEach((item) => {
      const isActive = item.dataset.value === value;
      item.classList.toggle("active", isActive);
      item.classList.toggle("inactive", !isActive);
    });

    const g = document.querySelector('.gallery-grid');
    const gallery = document.querySelector('.section-gallery');

    if (value === 'gallery') {
      if (gallery) {
        clearTimeout(gallery._hideT);
        gallery.classList.remove('leaving');
      }
      document.querySelectorAll('.section').forEach((section) => {
        section.classList.toggle('active', section.dataset.section === value);
      });
      if (g && g.scatterItems) g.scatterItems();
    } else {
      if (g && g.closeOverlay) g.closeOverlay();
      document.querySelectorAll('.section').forEach((section) => {
        section.classList.toggle('active', section.dataset.section === value);
      });
      if (gallery) {
        gallery.querySelectorAll('.gallery-item').forEach((it) => {
          it.style.opacity = '';
        });
        gallery.classList.add('leaving');
        clearTimeout(gallery._hideT);
        gallery._hideT = setTimeout(() => {
          gallery.classList.remove('leaving');
        }, 2200);
      }
    }
  };

  items.forEach((item) => {
    item.addEventListener("click", () => {
      if (item.classList.contains("active")) return;
      goTo(item.dataset.value);
    });
  });

  goTo(items[0].dataset.value);
})();

  /* ===== Scattered draggable gallery ===== */
  (function () {
     const gallerySection = document.querySelector(".section-gallery");
     const grid = document.querySelector(".gallery-grid");

     if (!gallerySection || !grid) return;

    const DRAG_THRESHOLD = 5;

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    const layoutItems = () => {
      const items = grid.querySelectorAll(".gallery-item");
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = 140;
      const h = 140;
      items.forEach((item) => {
        const x = clamp(Math.random() * (vw - w), 0, vw - w);
        const y = clamp(Math.random() * (vh - h), 0, vh - h);
        item.style.left = `${x}px`;
        item.style.top = `${y}px`;
        item.style.transform = `rotate(${(Math.random() - 0.5) * 24}deg) scale(${0.9 + Math.random() * 0.2})`;
        item.style.zIndex = Math.floor(Math.random() * 10) + 1;
      });
    };

    const scatterItems = () => {
      layoutItems();
      fadeInItems();
    };

    const fadeTimeouts = [];

    const fadeInItems = () => {
      const items = grid.querySelectorAll(".gallery-item");
      fadeTimeouts.forEach(clearTimeout);
      fadeTimeouts.length = 0;
      items.forEach((item, i) => {
        item.style.opacity = "0";
        const t = setTimeout(() => {
          item.style.opacity = "1";
        }, 60 * i);
        fadeTimeouts.push(t);
      });
    };

    const initPositions = () => {
      layoutItems();
    };

    let activeImageOverlay = null;

    const closeOverlay = () => {
      if (!activeImageOverlay) return;
      activeImageOverlay.classList.remove("visible");
      setTimeout(() => {
        if (activeImageOverlay) activeImageOverlay.style.display = "none";
      }, 500);
    };

    const ensureOverlay = () => {
      if (!activeImageOverlay) {
        activeImageOverlay = document.createElement("div");
        activeImageOverlay.className = "gallery-overlay";
        const img = document.createElement("img");
        img.draggable = false;
        img.addEventListener("dragstart", (e) => e.preventDefault());
        img.addEventListener("contextmenu", (e) => e.preventDefault());
        activeImageOverlay.appendChild(img);
        activeImageOverlay.addEventListener("click", closeOverlay);
        activeImageOverlay.addEventListener("contextmenu", (e) => e.preventDefault());
        document.body.appendChild(activeImageOverlay);
      }
      return activeImageOverlay;
    };

    const onItemClick = (e) => {
      const item = e.currentTarget;
      const img = item.querySelector("img");
      if (!img) return;
      const src = img.getAttribute("src");
      if (!src) return;
      const overlay = ensureOverlay();
      const targetImg = overlay.querySelector("img");
      targetImg.src = src;
      overlay.style.display = "flex";
      requestAnimationFrame(() => {
        overlay.classList.add("visible");
      });
    };

    const attachDrag = (item) => {
      let isDragging = false;
      let hasDragged = false;
      let startX = 0;
      let startY = 0;
      let initialLeft = 0;
      let initialTop = 0;

      const onPointerDown = (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        hasDragged = false;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = item.offsetLeft;
        initialTop = item.offsetTop;
        item.style.zIndex = 100;
        item.setPointerCapture(e.pointerId);
        item.style.cursor = "grabbing";
        e.preventDefault();
        e.stopPropagation();
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          hasDragged = true;
        }
        item.style.left = `${initialLeft + dx}px`;
        item.style.top = `${initialTop + dy}px`;
      };

      const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        item.style.cursor = "grab";
        if (!hasDragged) {
          onItemClick(e);
        }
      };

      item.addEventListener("pointerdown", onPointerDown);
      item.addEventListener("pointermove", onPointerMove);
      item.addEventListener("pointerup", onPointerUp);
      item.addEventListener("pointercancel", onPointerUp);
    };

    grid.querySelectorAll(".gallery-item").forEach((item) => {
      item.style.cursor = "grab";
      attachDrag(item);
    });

     grid.centerGrid = () => {};
    grid.scatterItems = scatterItems;
    grid.fadeInItems = fadeInItems;
    grid.closeOverlay = closeOverlay;

    grid.addEventListener("pointerdown", (e) => e.stopPropagation());

    window.addEventListener("resize", () => {
      if (gallerySection.classList.contains("active")) {
        layoutItems();
      }
    });
  })();

/* ---- Protect the sketch image from being copied/dragged ---- */
(function () {
  const s = document.querySelector(".sketch");
  if (!s) return;
  s.addEventListener("dragstart", (e) => e.preventDefault());
  s.addEventListener("contextmenu", (e) => e.preventDefault());
})();

/* ===== Envelope chat → Supabase ===== */
(function () {
  const SUPABASE_TABLE = "messages";
  const envelopeBtn = document.querySelector(".envelope-btn");
  const chatPanel = document.getElementById("chatPanel");
  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatName = document.getElementById("chatName");
  const chatClose = document.querySelector(".chat-close");

  if (!envelopeBtn || !chatPanel) return;

  const toggleChat = () => {
    const isOpen = chatPanel.classList.toggle("open");
    envelopeBtn.classList.toggle("active", isOpen);
    if (isOpen) {
      chatInput.focus();
      refreshChatPanel(false);
    }
  };

  envelopeBtn.addEventListener("click", toggleChat);
  if (chatClose) chatClose.addEventListener("click", toggleChat);

  document.addEventListener("click", (e) => {
    if (!chatPanel.classList.contains("open")) return;
    if (chatPanel.contains(e.target) || envelopeBtn.contains(e.target)) return;
    chatPanel.classList.remove("open");
    envelopeBtn.classList.remove("active");
  });

  const appendMessage = (text, type = "received") => {
    const div = document.createElement("div");
    div.className = `chat-message ${type}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const showHeart = () => {
    const heart = document.createElement("div");
    heart.textContent = "🖤";
    heart.style.cssText = `
      position: fixed;
      bottom: 5.5rem;
      right: 2rem;
      font-size: 22px;
      z-index: 40;
      pointer-events: none;
      animation: heartFloat 2s ease-out forwards;
    `;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 2000);
  };

  const sendMessage = async (name, content) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const words = trimmed.split(/\s+/);
    if (words.length > 3) {
      void chatPanel.offsetWidth;
      chatPanel.classList.add("shake");
      setTimeout(() => chatPanel.classList.remove("shake"), 400);
      return;
    }
    const from = name.trim() || "Anonymous";
    chatInput.value = "";
    chatName.value = "";
    updateWordCount();
    showHeart();

    const isAdmin = from.toLowerCase() === "iane" && trimmed.toLowerCase() === "congrats";

    if (isAdmin) {
      chatPanel.classList.add("open");
      envelopeBtn.classList.add("active");
      refreshChatPanel(true);
      return;
    } else {
      chatPanel.classList.remove("open");
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({ name: from, message: trimmed })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Supabase send failed:", response.status, errText);
        appendMessage("(failed to send)", "received");
      }
    } catch (error) {
      console.error("Supabase send error:", error);
    }
  };

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage(chatName.value, chatInput.value);
      chatInput.style.height = "auto";
      updateWordCount();
    });
  }

  const wordCount = document.getElementById("wordCount");

  const updateWordCount = () => {
    const text = chatInput.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = `${count}/3`;
  };

  const autoResize = () => {
    chatInput.style.height = "auto";
    const maxHeight = parseInt(getComputedStyle(chatInput).maxHeight, 10);
    chatInput.style.height = Math.min(chatInput.scrollHeight, maxHeight) + "px";
    updateWordCount();
  };

  if (chatInput) {
    chatInput.addEventListener("input", autoResize);
  }
})();


