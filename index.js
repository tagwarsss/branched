/* ===== Supabase Connection ===== */

const SUPABASE_URL = "https://rvyrpzuvwapwxpobicfb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eXJwenV2d2Fwd3hwb2JpY2ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzkyMjI3MSwiZXhwIjoyMTAzNDk4MjcxfQ.vql1Gr2HQYV70hkByl8BCTdxszoQDP4mPD86XMfRQCI";

async function fetchMessages() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?select=message`,
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
    const seen = new Set();
    const messages = [];
    for (const row of data) {
      const msg = row.message;
      if (msg && !seen.has(msg)) {
        seen.add(msg);
        messages.push(msg);
      }
    }
    return messages;
  } catch (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }
}

let currentMessages = new Set();

async function pollMessages() {
  const messages = await fetchMessages();
  const newMessages = [];
  for (const msg of messages) {
    if (!currentMessages.has(msg)) {
      currentMessages.add(msg);
      newMessages.push(msg);
    }
  }
  if (newMessages.length) {
    addWordsToBackground(newMessages);
  }
}

function addWordsToBackground(words) {
  const bg = document.querySelector(".background");
  if (!bg) return;
  const frag = document.createDocumentFragment();
  const existingCount = bg.querySelectorAll(".bg-word").length;
  const spans = [];
  words.forEach((msg, i) => {
    const span = document.createElement("span");
    span.className = "bg-word";
    const fontSize = Math.floor(14 + Math.random() * 36);
    span.style.cssText = `
      position:absolute;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      color:#fff;
      font-size:${fontSize}px;
      opacity:0;
      transition:opacity 0.3s ease;
      white-space:normal;
      max-width:300px;
      overflow-wrap:anywhere;
      word-break:break-word;
    `;
    span.textContent = msg;
    frag.appendChild(span);
    spans.push(span);
  });
  bg.appendChild(frag);
  requestAnimationFrame(() => {
    const allWords = bg.querySelectorAll(".bg-word");
    for (let i = existingCount; i < allWords.length; i++) {
      allWords[i].style.transitionDelay = `${0.3 + (i % 60) * 0.015}s`;
      allWords[i].style.opacity = "0.45";
    }
  });
}

(async function init() {
  const messages = await fetchMessages();
  if (!messages.length) return;
  const TEXT = messages;
  messages.forEach(m => currentMessages.add(m));

  /* ---- Full-screen background text ---- */
  const bg = document.querySelector(".background");
  const secretWordIndex = Math.floor(Math.random() * TEXT.length);
  let msgCount = 0;

  const frag = document.createDocumentFragment();
  const totalItems = TEXT.length;
  for (let i = 0; i < totalItems; i++) {
    const msg = TEXT[i];
    const span = document.createElement("span");
    const isSecret = i === secretWordIndex;
    const fontSize = Math.floor(14 + Math.random() * 36);

    span.className = "bg-word";

    span.style.cssText = `
      position:absolute;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      color:#fff;
      font-size:${fontSize}px;
      opacity:0;
      transition:opacity 0.3s ease;
      white-space:normal;
      max-width:300px;
      overflow-wrap:anywhere;
      word-break:break-word;
    `;

    span.textContent = msg;
    frag.appendChild(span);
  }
  bg.appendChild(frag);

  bg.classList.add("reveal");

  requestAnimationFrame(() => {
    const allWords = bg.querySelectorAll(".bg-word");
    allWords.forEach((span, i) => {
      span.style.transitionDelay = `${0.3 + (i % 60) * 0.015}s`;
      span.style.opacity = "0.45";
    });
  });

  setInterval(pollMessages, 1000);
})();

/* ---- Center text fade-in ---- */
const txtElement = document.querySelector(".txt");
const message = txtElement.textContent.trim();
txtElement.style.opacity = "1";
txtElement.textContent = "";

[...message].forEach((char, index) => {
  const span = document.createElement("span");
  span.textContent = char;
  span.style.animationDelay = `${index * 0.04}s`;
  span.style.display = char === " " ? "inline-block" : "inline";
  txtElement.appendChild(span);
});

/* ---- Reveal sketch + fade the text out ~4s after the text transition in ---- */
const sketch = document.querySelector(".sketch");
const textDuration = message.length * 0.04 + 0.5;
const showHold = 5000;

setTimeout(() => {
  sketch.classList.add("reveal");
  const nav = document.querySelector(".nav-bar");
  if (nav) nav.classList.add("reveal");
  txtElement.style.transition = "opacity 0.8s ease";
  txtElement.style.opacity = "0";
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
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.toggle("active", section.dataset.section === value);
    });
    if (value === 'gallery') {
      const g = document.querySelector('.gallery-grid');
      if (g && g.centerGrid) g.centerGrid();
    }
  };

  items.forEach((item) => {
    item.addEventListener("click", () => goTo(item.dataset.value));
  });

  goTo(items[0].dataset.value);
})();

  /* ===== Draggable gallery grid ===== */
  (function () {
    const gallerySection = document.querySelector(".section-gallery");
    const grid = document.querySelector(".gallery-grid");

    if (!gallerySection || !grid) return;

    let isDragging = false;
    let hasDragged = false;
    const DRAG_THRESHOLD = 5;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    /* ---- Get the exact center of the grid ---- */
    const getGridCenter = () => {
      return {
        x: grid.offsetWidth / 2,
        y: grid.offsetHeight / 2
      };
    };

    /* ---- Get the exact center of the screen ---- */
    const getScreenCenter = () => {
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      };
    };

    /* ---- Move grid center to screen center ---- */
    const centerGrid = () => {
      const gridCenter = getGridCenter();
      const screenCenter = getScreenCenter();

      currentX = screenCenter.x - gridCenter.x;
      currentY = screenCenter.y - gridCenter.y;

      setTransform();
    };

    /* ---- Apply grid position ---- */
    const setTransform = () => {
      grid.style.transform =
        `translate(${currentX}px, ${currentY}px)`;
    };

    /* ---- Start dragging ---- */
    const onPointerDown = (e) => {
      isDragging = true;
      hasDragged = false;

      startX = e.clientX;
      startY = e.clientY;

      gallerySection.style.cursor = "grabbing";

      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        hasDragged = true;
      }

      let nextX = currentX + dx;
      let nextY = currentY + dy;

      const gridWidth = grid.offsetWidth;
      const gridHeight = grid.offsetHeight;

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const margin = 20;

      const minX = screenWidth - gridWidth - margin;
      const maxX = margin;
      const minY = screenHeight - gridHeight - margin;
      const maxY = margin;

      if (nextX < minX) nextX = minX + (nextX - minX) * 0.25;
      else if (nextX > maxX) nextX = maxX + (nextX - maxX) * 0.25;

      if (nextY < minY) nextY = minY + (nextY - minY) * 0.25;
      else if (nextY > maxY) nextY = maxY + (nextY - maxY) * 0.25;

      currentX = nextX;
      currentY = nextY;

      startX = e.clientX;
      startY = e.clientY;

      setTransform();
    };

    /* ---- Stop dragging ---- */
    const onPointerUp = () => {
      isDragging = false;
      gallerySection.style.cursor = "grab";
    };

    let activeImageOverlay = null;

    const ensureOverlay = () => {
      if (!activeImageOverlay) {
        activeImageOverlay = document.createElement("div");
        activeImageOverlay.style.cssText = "display:none;position:fixed;inset:0;z-index:50;background:rgba(0,0,0,0.95);align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-user-select:none";
        const img = document.createElement("img");
        img.style.cssText = "max-width:90vw;max-height:90vh;object-fit:contain;pointer-events:none;border-radius:5%;user-select:none;-webkit-user-select:none";
        img.draggable = false;
        img.addEventListener("dragstart", (e) => e.preventDefault());
        img.addEventListener("contextmenu", (e) => e.preventDefault());
        activeImageOverlay.appendChild(img);
        activeImageOverlay.addEventListener("click", () => {
          activeImageOverlay.style.display = "none";
        });
        activeImageOverlay.addEventListener("contextmenu", (e) => e.preventDefault());
        document.body.appendChild(activeImageOverlay);
      }
      return activeImageOverlay;
    };

    const onItemClick = (e) => {
      if (hasDragged) return;
      const item = e.currentTarget;
      const img = item.querySelector("img");
      if (!img) return;
      const src = img.getAttribute("src");
      if (!src) return;
      const overlay = ensureOverlay();
      const targetImg = overlay.querySelector("img");
      targetImg.src = src;
      overlay.style.display = "flex";
    };

    grid.querySelectorAll(".gallery-item").forEach((item) => {
      item.style.cursor = "pointer";
      item.addEventListener("click", onItemClick);
    });

    /* ---- Make centerGrid accessible to navigation ---- */
    grid.centerGrid = centerGrid;

    gallerySection.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    /* ---- Initial center ---- */
    centerGrid();

    /* ---- Re-center when window changes size ---- */
    window.addEventListener("resize", () => {
      centerGrid();
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
    if (isOpen) chatInput.focus();
  };

  envelopeBtn.addEventListener("click", toggleChat);
  if (chatClose) chatClose.addEventListener("click", toggleChat);

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
    if (words.length > 12) {
      void chatPanel.offsetWidth;
      chatPanel.classList.add("shake");
      setTimeout(() => chatPanel.classList.remove("shake"), 400);
      return;
    }
    const from = name.trim() || "Anonymous";
    chatInput.value = "";
    chatPanel.classList.remove("open");
    showHeart();

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
      appendMessage("(failed to send)", "received");
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
    wordCount.textContent = `${count}/12`;
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


