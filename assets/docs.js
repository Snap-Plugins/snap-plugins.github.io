// Snap Plugins docs pages: the "On this page" list (it follows the section being read), the side menu on small screens,
// warning / tip boxes, a Copy button on code, previous / next links and a back-to-top button.
// Every part does nothing on a page without the elements it needs, so the hub can load this file too.
(function () {
  var content = document.querySelector(".content");
  if (!content) return;

  buildToc();
  markInPageToc();
  markCallouts();
  softBreakTableCode();
  addCopyButtons();
  buildPager();
  wireMenu();
  wireBackToTop();

  // A heading's text without the "#" link theme.js appends to it.
  function headingText(h) {
    var copy = h.cloneNode(true);
    var anchors = copy.querySelectorAll(".heading-anchor");
    for (var i = 0; i < anchors.length; i++) anchors[i].remove();
    return copy.textContent.trim();
  }

  function buildToc() {
    var holder = document.getElementById("toc");
    if (!holder) return;
    var heads = content.querySelectorAll("h2[id], h3[id]");
    if (heads.length < 2) { holder.closest(".toc").hidden = true; return; }
    var list = document.createElement("ul");
    var links = [];
    for (var i = 0; i < heads.length; i++) {
      var li = document.createElement("li");
      if (heads[i].tagName === "H3") li.className = "toc-sub";
      var a = document.createElement("a");
      a.href = "#" + heads[i].id;
      a.textContent = headingText(heads[i]);
      li.appendChild(a);
      list.appendChild(li);
      links.push(a);
    }
    holder.appendChild(list);
    if (!("IntersectionObserver" in window)) return;

    // The active entry is the last heading that has scrolled past the top band of the window.
    var shown = {};
    var observer = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) shown[entries[k].target.id] = entries[k].boundingClientRect.top < window.innerHeight * 0.3;
      var current = -1;
      for (var j = 0; j < heads.length; j++) if (shown[heads[j].id]) current = j;
      for (var m = 0; m < links.length; m++) links[m].classList.toggle("active", m === current);
      if (current >= 0) {
        var box = holder.closest(".toc");
        var link = links[current];
        if (link.offsetTop < box.scrollTop || link.offsetTop > box.scrollTop + box.clientHeight - 40) box.scrollTop = link.offsetTop - 80;
      }
    }, { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] });
    for (var n = 0; n < heads.length; n++) observer.observe(heads[n]);
  }

  // A page's own "On this page:" line (and the list right after it) repeats the side list; site.css hides it where that shows.
  function markInPageToc() {
    if (!document.getElementById("toc")) return;
    var paragraphs = content.querySelectorAll("p");
    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      if (!/^On this page:/.test(p.textContent.trim())) continue;
      p.classList.add("inpage-toc");
      var next = p.nextElementSibling;
      if (next && /^(UL|OL)$/.test(next.tagName)) next.classList.add("inpage-toc");
    }
  }

  // A quote that opens with a warning sign becomes a warning box; a star or bulb, a tip; "Note", a note.
  function markCallouts() {
    var quotes = content.querySelectorAll("blockquote");
    for (var i = 0; i < quotes.length; i++) {
      var text = quotes[i].textContent.replace(/^\s+/, "");
      if (/^⚠/.test(text)) quotes[i].classList.add("callout-warn");
      else if (/^(⭐|💡|Tip\b)/.test(text)) quotes[i].classList.add("callout-tip");
      else if (/^Note\b/.test(text)) quotes[i].classList.add("callout-note");
    }
  }

  // A long name in a table cell may wrap after a / . _ or :: instead of mid-word. <wbr> adds no character, so a copy
  // of the name stays exact.
  function softBreakTableCode() {
    var codes = content.querySelectorAll("td code, th code");
    for (var i = 0; i < codes.length; i++) {
      var code = codes[i];
      var text = code.textContent;
      if (code.children.length || text.length < 20) continue;
      code.textContent = "";
      var piece = "";
      for (var k = 0; k < text.length; k++) {
        var ch = text.charAt(k);
        piece += ch;
        var breaks = ch === "/" || ch === "." || ch === "_" || (ch === ":" && text.charAt(k + 1) !== ":");
        if (breaks && k < text.length - 1) {
          code.appendChild(document.createTextNode(piece));
          code.appendChild(document.createElement("wbr"));
          piece = "";
        }
      }
      if (piece) code.appendChild(document.createTextNode(piece));
    }
  }

  function addCopyButtons() {
    var blocks = content.querySelectorAll("pre");
    for (var i = 0; i < blocks.length; i++) {
      var pre = blocks[i];
      var wrap = document.createElement("div");
      wrap.className = "code-wrap";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "copy-btn";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy this code");
      button.addEventListener("click", copyFrom(pre, button));
      wrap.appendChild(button);
    }
  }

  function copyFrom(pre, button) {
    return function () {
      var text = pre.innerText;
      var done = function () {
        button.textContent = "Copied";
        setTimeout(function () { button.textContent = "Copy"; }, 1500);
      };
      var fallback = function () {
        var area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        try { if (document.execCommand("copy")) done(); } catch (e) { /* nothing to copy with */ }
        document.body.removeChild(area);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    };
  }

  // Previous / next follow the order of the side menu.
  function buildPager() {
    var holder = content.querySelector(".pager");
    var links = document.querySelectorAll(".sidebar a");
    if (!holder || !links.length) return;
    var at = -1;
    for (var i = 0; i < links.length; i++) if (links[i].getAttribute("aria-current") === "page") at = i;
    if (at < 0) { holder.remove(); return; }
    if (at > 0) holder.appendChild(pagerLink(links[at - 1], "prev", "← Previous"));
    if (at < links.length - 1) holder.appendChild(pagerLink(links[at + 1], "next", "Next →"));
  }

  function pagerLink(source, kind, label) {
    var a = document.createElement("a");
    a.href = source.href;
    a.className = kind;
    var small = document.createElement("small");
    small.textContent = label;
    a.appendChild(small);
    a.appendChild(document.createTextNode(source.textContent));
    return a;
  }

  // The side menu on small screens. Menu opens it; Close, a tap on the dimmed page, a swipe to the left, Escape or a link
  // closes it. While it is open the page behind is held still (site.css fixes the body in place; its scroll position is kept
  // here and given back on close), so a swipe scrolls the menu, not the page.
  function wireMenu() {
    var button = document.querySelector(".menu-toggle");
    var sidebar = document.querySelector(".sidebar");
    if (!button || !sidebar) return;
    var body = document.body;
    var closeButton = sidebar.querySelector(".drawer-close");
    var backdrop = document.querySelector(".nav-backdrop");
    var heldAt = 0;
    var isOpen = function () { return body.classList.contains("nav-open"); };
    var setOpen = function (open, keepFocus) {
      if (open === isOpen()) return;
      if (open) {
        heldAt = window.scrollY;
        body.style.top = -heldAt + "px";
        body.classList.add("nav-open");
        var current = sidebar.querySelector('[aria-current="page"]');
        sidebar.scrollTop = current ? Math.max(0, current.offsetTop - sidebar.clientHeight / 3) : 0;
        if (closeButton) closeButton.focus();
      } else {
        body.classList.remove("nav-open");
        body.style.top = "";
        window.scrollTo(0, heldAt);
        if (!keepFocus) button.focus();
      }
      button.setAttribute("aria-expanded", open ? "true" : "false");
    };
    button.addEventListener("click", function () { setOpen(!isOpen()); });
    if (closeButton) closeButton.addEventListener("click", function () { setOpen(false); });
    if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });
    sidebar.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false, true); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen()) setOpen(false); });

    var startX = null;
    var startY = null;
    sidebar.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
    sidebar.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.5) setOpen(false);
      startX = null;
    }, { passive: true });
    // Widened past the phone layout, the menu is the sidebar again: give the page back.
    window.addEventListener("resize", function () { if (isOpen() && window.innerWidth > 900) setOpen(false, true); });
  }

  function wireBackToTop() {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "pill to-top";
    button.textContent = "↑ Top";
    button.setAttribute("aria-label", "Back to the top of the page");
    button.hidden = true;
    button.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(button);
    var update = function () { button.hidden = window.scrollY < 900; };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
})();
