/* ===== Supabase Connection ===== */
/* ===== Supabase Connection ===== */

const SUPABASE_URL = "https://rvyrpzuvwapwxpobicfb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eXJwenV2d2Fwd3hwb2JpY2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjIyNzEsImV4cCI6MjEwMzQ5ODI3MX0.9dysuEyVyc-jL27bSQs9YibqeuUqlUb2VyQrL2L4QWQ";


/* ===== Last processed database ID ===== */

let lastMessageId = 0;

/* ===== Intro text still animating/transitioning? ===== */

let initialLoadComplete = false;
let txtIntroDone = false;
let introComplete = false;

function maybeEnableListening() {
  if (initialLoadComplete && txtIntroDone) {
    introComplete = true;
  }
}


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
        newMessages.push({ name: row.name, message: row.message });
      }

      /* ---- Remember the newest ID ---- */

      if (Number(row.id) > lastMessageId) {
        lastMessageId = Number(row.id);
      }
    });

    if (newMessages.length) {
      const textOnly = newMessages.map((m) => m.message);
      addWordsToBackground(textOnly);
    }

    refreshChatPanel();

    if (newMessages.length) {
      const congratsOverlay = document.getElementById("congratsOverlay");
      if (congratsOverlay && congratsOverlay.classList.contains("open") && window.updateCongratsBubbles) {
        window.updateCongratsBubbles(newMessages);
      }
    }

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

  /* ---- Initial load finished ---- */

  initialLoadComplete = true;
  maybeEnableListening();

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

  /* ---- Allow "iane" keyboard listeners only after the intro text finishes ---- */
  setTimeout(() => {
    txtIntroDone = true;
    maybeEnableListening();
  }, 800);
}, textDuration + showHold);

/* ===== Top navigation bar ===== */
(function () {
  const nav = document.querySelector(".nav-bar");
  if (!nav) return;
  const items = [...nav.querySelectorAll(".nav-item")];
  if (items.length === 0) return;

  let cooldown = false;

  const goTo = (value) => {
    items.forEach((item) => {
      const isActive = item.dataset.value === value;
      item.classList.toggle("active", isActive);
      item.classList.toggle("inactive", !isActive);
    });

     const g = document.querySelector('.gallery-grid');
     const gallery = document.querySelector('.section-gallery');
     const sketchEl = document.querySelector('.sketch');

     if (sketchEl) {
       sketchEl.classList.toggle('sketch-out', value === 'gallery');
     }

     if (value === 'gallery') {
      if (gallery) {
        clearTimeout(gallery._hideT);
        gallery.classList.remove('leaving');
      }
      document.querySelectorAll('.section').forEach((section) => {
        section.classList.toggle('active', section.dataset.section === value);
      });
      if (g && g.loadGallery && !g.dataset.initialized) {
        g.loadGallery();
        g.dataset.initialized = "true";
      } else if (g && g.fadeInItems) {
        g.fadeInItems();
      }
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

  let cooldownTimer = null;

  items.forEach((item) => {
    item.addEventListener("click", () => {
      if (cooldown) return;
      if (item.classList.contains("active")) return;
      cooldown = true;
      nav.classList.add("cooldown");
      clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        cooldown = false;
        nav.classList.remove("cooldown");
      }, 3000);
      goTo(item.dataset.value);
    });
  });

  goTo(items[0].dataset.value);
})();

  /* ===== Scattered draggable gallery ===== */
  (function () {
     const gallerySection = document.querySelector(".section-gallery");
     const grid = document.querySelector(".gallery-grid");
     const trashcan = document.getElementById("trashcan");

     if (!gallerySection || !grid) return;

    const DRAG_THRESHOLD = 5;

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    const layoutItems = () => {
      const items = grid.querySelectorAll(".gallery-item");
      items.forEach((item) => {
        scatterItem(item);
      });
    };

    const scatterItem = (item) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = 140;
      const h = 140;
      const maxScale = 1.3;
      const x = clamp(Math.random() * (vw - w * maxScale), 0, vw - w * maxScale);
      const y = clamp(Math.random() * (vh - h * maxScale), 0, vh - h * maxScale);
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      item.style.transform = `rotate(${(Math.random() - 0.5) * 24}deg) scale(${1.0 + Math.random() * 0.3})`;
      item.style.zIndex = Math.floor(Math.random() * 10) + 1;
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
        }, 500 + 150 * i);
        fadeTimeouts.push(t);
      });
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

      const getTrashcanRect = () => {
        if (!trashcan) return null;
        const rect = trashcan.getBoundingClientRect();
        return {
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          halfW: rect.width / 2,
          halfH: rect.height / 2,
        };
      };

      const isOverTrashcan = (x, y) => {
        const r = getTrashcanRect();
        if (!r) return false;
        const dx = x - r.cx;
        const dy = y - r.cy;
        return Math.abs(dx) < r.halfW + 20 && Math.abs(dy) < r.halfH + 20;
      };

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

        if (trashcan && trashcan.classList.contains("visible")) {
          if (isOverTrashcan(e.clientX, e.clientY)) {
            trashcan.classList.add("attract");
            item.classList.add("over-trashcan");
          } else {
            trashcan.classList.remove("attract");
            item.classList.remove("over-trashcan");
          }
        }
      };

      const onPointerUp = async (e) => {
        if (!isDragging) return;
        isDragging = false;
        item.style.cursor = "grab";
        trashcan.classList.remove("attract");
        item.classList.remove("over-trashcan");

        if (!hasDragged) {
          onItemClick(e);
          return;
        }

        if (trashcan && trashcan.classList.contains("visible") && isOverTrashcan(e.clientX, e.clientY)) {
          const fileName = item.dataset.fileName;
          console.log("Trashcan drop:", fileName);
          trashcan.classList.add("drop");
          setTimeout(() => trashcan.classList.remove("drop"), 350);

          item.classList.add("trash-anim");

          setTimeout(async () => {
            if (fileName) {
              console.log("Attempting to delete from bucket:", fileName);
              try {
                if (!window.supabase) {
                  console.error("Supabase client not loaded.");
                  return;
                }
                const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                
                const { data: listData } = await supabase.storage.from("picture").list();
                const exists = (listData || []).some((f) => f.name === fileName);
                console.log("File exists in bucket before delete:", exists, "files:", (listData || []).map((f) => f.name));

                const { data, error } = await supabase.storage.from("picture").remove([fileName]);
                console.log("Remove response data:", data, "error:", error);
                if (error) {
                  console.error("Trash bucket delete failed:", error);
                } else {
                  console.log("Delete request sent for:", fileName);
                }

                const encodedPath = encodeURIComponent(fileName);
                console.log("Trying REST API delete for path:", encodedPath);
                const restResponse = await fetch(
                  `${SUPABASE_URL}/storage/v1/object/picture/${encodedPath}`,
                  {
                    method: "DELETE",
                    headers: {
                      apikey: SUPABASE_ANON_KEY,
                      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    },
                  }
                );
                console.log("REST delete status:", restResponse.status, restResponse.statusText);
                const restText = await restResponse.text();
                console.log("REST delete body:", restText);

                await new Promise((r) => setTimeout(r, 1500));

                const { data: afterData } = await supabase.storage.from("picture").list();
                const stillExists = (afterData || []).some((f) => f.name === fileName);
                console.log("File exists in bucket after delete (1.5s delay):", stillExists, "files:", (afterData || []).map((f) => f.name));
              } catch (err) {
                console.error("Trash delete error:", err);
              }
            }
            item.remove();
          }, 400);
        }
      };

      item.addEventListener("pointerdown", onPointerDown);
      item.addEventListener("pointermove", onPointerMove);
      item.addEventListener("pointerup", onPointerUp);
      item.addEventListener("pointercancel", onPointerUp);
    };

     grid.attachDragToItem = attachDrag;

    const knownGalleryFiles = new Set();

     const createGalleryItem = (src, fileName) => {
       const item = document.createElement("div");
       item.className = "gallery-item";
       item.dataset.fileName = fileName || "";
       const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.draggable = false;
      img.addEventListener("dragstart", (e) => e.preventDefault());
      img.addEventListener("contextmenu", (e) => e.preventDefault());
      img.addEventListener("error", () => console.error("Failed to load image:", src));
      img.addEventListener("load", () => console.log("Loaded image:", src));
      item.appendChild(img);
      item.style.opacity = "0";
      item.style.cursor = "grab";
      attachDrag(item);
      return item;
    };

    const getImageFiles = async (supabase) => {
      const { data, error } = await supabase.storage.from("picture").list();
      if (error) {
        console.error("Bucket list error:", error);
        return [];
      }
      
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".jfif", ".bmp", ".svg"];
      return (data || []).filter((file) => {
        const name = (file.name || "").toLowerCase();
        const isFolder = name.endsWith("/");
        const isImage = imageExtensions.some((ext) => name.endsWith(ext));
        return !isFolder && isImage;
      });
    };

    const appendGalleryItems = async (files) => {
      if (!files.length) return;
      
      const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const newItems = [];
      
      files.forEach((file) => {
        const name = file.name || "";
        if (knownGalleryFiles.has(name)) return;
        
        knownGalleryFiles.add(name);
        const { data: pub } = supabase.storage.from("picture").getPublicUrl(name);
        const src = pub.publicUrl;
        const item = createGalleryItem(src, name);
        scatterItem(item);
        item.style.opacity = "0";
        grid.appendChild(item);
        newItems.push(item);
      });
      
      if (newItems.length) {
        newItems.forEach((item, i) => {
          const t = setTimeout(() => {
            item.style.opacity = "1";
          }, 500 + 150 * i);
          fadeTimeouts.push(t);
        });
      }
    };

    grid.loadGallery = async () => {
      grid.innerHTML = "";
      knownGalleryFiles.clear();
      
      try {
        if (!window.supabase) {
          console.error("Supabase client not loaded.");
          grid.innerHTML = '<div style="color:#fff;text-align:center;padding:2rem;">Supabase not loaded.</div>';
          return;
        }
        
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const files = await getImageFiles(supabase);
        
        if (!files.length) {
          return;
        }
        
        await appendGalleryItems(files);
      } catch (error) {
        console.error("Gallery load error:", error);
        grid.innerHTML = '<div style="color:#fff;text-align:center;padding:2rem;">Failed to load gallery.</div>';
      }
    };

    grid.scatterItems = scatterItems;
    grid.fadeInItems = fadeInItems;
    grid.closeOverlay = closeOverlay;

    grid.addEventListener("pointerdown", (e) => e.stopPropagation());

    setInterval(async () => {
      if (!window.supabase) return;
      
      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const files = await getImageFiles(supabase);
        await appendGalleryItems(files);
      } catch (error) {
        console.error("Gallery poll error:", error);
      }
    }, 5000);
  })();

/* ---- Protect the sketch image from being copied/dragged ---- */
(function () {
  const s = document.querySelector(".sketch");
  if (!s) return;
  s.addEventListener("dragstart", (e) => e.preventDefault());
  s.addEventListener("contextmenu", (e) => e.preventDefault());
})();

/* ===== Envelope chat → Supabase ===== */
function showHeart() {
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
}
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

  const sendMessage = async (name, content) => {
    const trimmed = content.trim();
    if (!trimmed) {
      void chatPanel.offsetWidth;
      chatPanel.classList.add("shake");
      setTimeout(() => chatPanel.classList.remove("shake"), 400);
      return;
    }
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
       chatPanel.classList.remove("open");
       envelopeBtn.classList.remove("active");
       if (window.showCongratsPanel) {
         window.showCongratsPanel();
       }
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

/* ===== Center Congrats Panel ===== */
(function () {
  const overlay = document.getElementById("congratsOverlay");
  const bubbles = document.getElementById("congratsBubbles");
  const closeBtn = document.getElementById("congratsClose");

  if (!overlay || !bubbles) return;

  let lastRenderedCount = 0;

  const createBubble = (row) => {
    const wrapper = document.createElement("div");
    wrapper.className = "congrats-bubble-wrapper received";

    const bubble = document.createElement("div");
    bubble.className = "congrats-bubble";
    bubble.dataset.id = row.id;

    const nameDiv = document.createElement("span");
    nameDiv.className = "bubble-name";
    nameDiv.textContent = row.name || "Anonymous";

    const textDiv = document.createElement("span");
    textDiv.className = "bubble-text";
    textDiv.textContent = row.message;

    const menuBtn = document.createElement("button");
    menuBtn.className = "bubble-menu-btn";
    menuBtn.setAttribute("aria-label", "Message options");
    menuBtn.textContent = "⋯";

    const dropdown = document.createElement("div");
    dropdown.className = "bubble-dropdown";
    dropdown.style.display = "none";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";

    dropdown.appendChild(deleteBtn);

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display !== "none";
      bubbles.querySelectorAll(".bubble-dropdown").forEach((d) => {
        if (d !== dropdown) d.style.display = "none";
        d.parentElement.classList.remove("dropdown-open");
      });
      wrapper.classList.remove("dropdown-open");
      dropdown.style.display = isVisible ? "none" : "block";
      if (!isVisible) {
        wrapper.classList.add("dropdown-open");
      }
    });

    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = bubble.dataset.id;
      const name = row.name || "Anonymous";
      const message = row.message;
      if (!id) return;

      console.log("Deleting message:", { id, name, message });
      bubble.style.opacity = "0.4";
      dropdown.style.display = "none";
      wrapper.classList.remove("dropdown-open");

      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/messages?name=eq.${encodeURIComponent(name)}&message=eq.${encodeURIComponent(message)}`,
          {
            method: "DELETE",
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=representation"
            }
          }
        );

        const result = await response.json().catch(() => null);

        if (response.ok) {
          console.log("Delete result:", result);
          if (result && result.length > 0) {
            console.log("Message deleted successfully:", { name, message });
            wrapper.remove();
          } else {
            console.log("No rows matched the delete filter, removing from UI only");
            wrapper.remove();
          }
        } else {
          bubble.style.opacity = "1";
          console.error("Failed to delete message:", response.status, result);
        }
      } catch (error) {
        bubble.style.opacity = "1";
        console.error("Delete error:", error);
      }
    });

    bubble.appendChild(nameDiv);
    bubble.appendChild(textDiv);
    wrapper.appendChild(bubble);
    wrapper.appendChild(menuBtn);
    wrapper.appendChild(dropdown);
    return wrapper;
  };

  const createTypingBubble = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "congrats-bubble-wrapper received";

    const bubble = document.createElement("div");
    bubble.className = "congrats-bubble typing";

    const nameDiv = document.createElement("span");
    nameDiv.className = "bubble-name";
    nameDiv.textContent = "Someone";

    const textDiv = document.createElement("span");
    textDiv.className = "bubble-text";
    textDiv.textContent = "typing...";

    bubble.appendChild(nameDiv);
    bubble.appendChild(textDiv);
    wrapper.appendChild(bubble);
    return wrapper;
  };

  const renderAllBubbles = async () => {
    bubbles.innerHTML = "";

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

      if (!response.ok) return;

      const data = await response.json();
      lastRenderedCount = 0;

      data.forEach((row) => {
        if (!row.message) return;
        bubbles.appendChild(createBubble(row));
        lastRenderedCount++;
      });

      bubbles.scrollTop = bubbles.scrollHeight;
    } catch (error) {
      console.error("Congrats panel error:", error);
    }
  };

  const appendNewBubbles = (rows) => {
    if (!rows || !rows.length) return;

    rows.forEach((row, i) => {
      setTimeout(() => {
        const typingBubble = createTypingBubble();
        bubbles.appendChild(typingBubble);
        bubbles.scrollTop = bubbles.scrollHeight;

        setTimeout(() => {
          const actualBubble = createBubble(row);
          typingBubble.replaceWith(actualBubble);
          bubbles.scrollTop = bubbles.scrollHeight;
        }, 600 + Math.random() * 400);
      }, i * 700);
    });

    lastRenderedCount += rows.length;
  };

  window.showCongratsPanel = () => {
    overlay.classList.add("open");
    renderAllBubbles();
  };

  window.updateCongratsBubbles = (newRows) => {
    if (!newRows || !newRows.length) return;
    appendNewBubbles(newRows);
  };

  const closePanel = () => {
    overlay.classList.remove("open");
  };

  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePanel();
  });

  document.addEventListener("click", (e) => {
    if (!overlay.classList.contains("open")) return;
    bubbles.querySelectorAll(".bubble-dropdown").forEach((dropdown) => {
      if (dropdown.style.display !== "none") {
        const bubble = dropdown.parentElement;
        if (!bubble.contains(e.target)) {
          dropdown.style.display = "none";
          bubble.classList.remove("dropdown-open");
        }
      }
    });
  });
})();

/* ===== Upload picture → Supabase Storage ===== */
(function () {
  const uploadBtn = document.querySelector(".upload-btn");
  const uploadPanel = document.getElementById("uploadPanel");
  const uploadClose = document.querySelector(".upload-close");
  const uploadInput = document.getElementById("uploadFileInput");
  const uploadCount = document.getElementById("uploadCount");
  const uploadSubmit = document.getElementById("uploadSubmit");
  const uploadFileList = document.getElementById("uploadFileList");

  if (!uploadBtn || !uploadPanel) return;

  const MAX_FILES = 3;
  let selectedFiles = [];

  const updateUploadCount = () => {
    if (!uploadCount) return;
    uploadCount.textContent = `${selectedFiles.length}/${MAX_FILES}`;
  };

  const renderFileList = () => {
    if (!uploadFileList) return;
    uploadFileList.innerHTML = "";

    selectedFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "upload-file-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "upload-file-item-name";
      nameSpan.textContent = file.name;
      nameSpan.title = file.name;

      const removeBtn = document.createElement("button");
      removeBtn.className = "upload-file-item-remove";
      removeBtn.innerHTML = "&times;";
      removeBtn.setAttribute("aria-label", `Remove ${file.name}`);
      removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedFiles.splice(index, 1);
        renderFileList();
        updateUploadCount();
        uploadInput.value = "";
      });

      item.appendChild(nameSpan);
      item.appendChild(removeBtn);
      uploadFileList.appendChild(item);
    });
  };

  if (uploadInput) {
    uploadInput.addEventListener("change", () => {
      const files = Array.from(uploadInput.files || []);
      const remaining = MAX_FILES - selectedFiles.length;
      const toAdd = files.slice(0, Math.max(0, remaining));

      if (toAdd.length < files.length) {
        void uploadPanel.offsetWidth;
        uploadPanel.classList.add("shake");
        setTimeout(() => uploadPanel.classList.remove("shake"), 400);
      }

      selectedFiles = selectedFiles.concat(toAdd);
      renderFileList();
      updateUploadCount();
      uploadInput.value = "";
    });
  }

  const toggleUpload = () => {
    const isOpen = uploadPanel.classList.toggle("open");
    uploadBtn.classList.toggle("active", isOpen);
    if (isOpen) {
      uploadInput.value = "";
    }
  };

  uploadBtn.addEventListener("click", toggleUpload);
  if (uploadClose) uploadClose.addEventListener("click", toggleUpload);

  document.addEventListener("click", (e) => {
    if (!uploadPanel.classList.contains("open")) return;
    if (uploadPanel.contains(e.target) || uploadBtn.contains(e.target)) return;
    uploadPanel.classList.remove("open");
    uploadBtn.classList.remove("active");
  });

  if (uploadSubmit && uploadInput) {
    uploadSubmit.addEventListener("click", async () => {
      const files = selectedFiles;
      if (!files.length) {
        void uploadPanel.offsetWidth;
        uploadPanel.classList.add("shake");
        setTimeout(() => uploadPanel.classList.remove("shake"), 400);
        return;
      }

      if (files.length > MAX_FILES) {
        void uploadPanel.offsetWidth;
        uploadPanel.classList.add("shake");
        setTimeout(() => uploadPanel.classList.remove("shake"), 400);
        return;
      }

      uploadSubmit.disabled = true;

      try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const uploadPromises = files.map((file) => {
          const filePath = `${Date.now()}_${file.name}`;
          return supabase.storage
            .from("picture")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false
            })
            .then(({ error }) => {
              if (error) {
                console.error("Upload error for file:", file.name, error);
              }
            });
        });

        await Promise.all(uploadPromises);

        uploadPanel.classList.remove("open");
        uploadBtn.classList.remove("active");
        showHeart();
        selectedFiles = [];
        renderFileList();
        updateUploadCount();
      } catch (error) {
        console.error("Upload error:", error);
        void uploadPanel.offsetWidth;
        uploadPanel.classList.add("shake");
        setTimeout(() => uploadPanel.classList.remove("shake"), 400);
      } finally {
        uploadSubmit.disabled = false;
      }
    });
  }
})();

/* ===== Gallery typing easter egg ===== */
(function () {
  const trashcan = document.getElementById("trashcan");
  if (!trashcan) return;

  let buffer = "";
  const MAX_BUFFER = 200;
  let trashcanVisible = false;

  const updateTrashcan = () => {
    if (buffer.toLowerCase().includes("iane")) {
      trashcanVisible = !trashcanVisible;
      if (trashcanVisible) {
        trashcan.classList.add("visible");
      } else {
        trashcan.classList.remove("visible");
      }
      buffer = "";
    }
  };

  document.addEventListener("keydown", (e) => {
    if (!introComplete) return;

    if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      return;
    }

    if (!document.querySelector(".section-gallery.active")) {
      buffer = "";
      return;
    }

    if (e.key === "Backspace") {
      buffer = buffer.slice(0, -1);
      updateTrashcan();
      return;
    }

    if (e.key === "Escape") {
      buffer = "";
      updateTrashcan();
      return;
    }

    if (e.key.length === 1) {
      buffer += e.key;
      if (buffer.length > MAX_BUFFER) {
        buffer = buffer.slice(-MAX_BUFFER);
      }
      updateTrashcan();
    }
  });
})();

/* ===== Home typing easter egg ===== */
(function () {
  const overlay = document.getElementById("congratsOverlay");
  if (!overlay) return;

  let buffer = "";
  const MAX_BUFFER = 200;

  const showPanel = () => {
    if (window.showCongratsPanel) {
      window.showCongratsPanel();
    }
    buffer = "";
  };

  document.addEventListener("keydown", (e) => {
    if (!introComplete) return;

    if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      return;
    }

    if (!document.querySelector(".section-home.active")) {
      buffer = "";
      return;
    }

    if (e.key === "Backspace") {
      buffer = buffer.slice(0, -1);
      return;
    }

    if (e.key === "Escape") {
      buffer = "";
      return;
    }

    if (e.key.length === 1) {
      buffer += e.key;
      if (buffer.length > MAX_BUFFER) {
        buffer = buffer.slice(-MAX_BUFFER);
      }

      if (buffer.toLowerCase().includes("iane")) {
        showPanel();
      }
    }
  });
})();


