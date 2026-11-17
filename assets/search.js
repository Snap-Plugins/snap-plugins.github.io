// Snap Plugins docs: the header search box. Loads the site's search index (search.json, named on the input's data-index)
// the first time the box is used, then lists the pages that hold every word typed -- title matches first -- each with a short
// excerpt. Arrow keys move through the results, Enter opens one, Escape closes the list, and "/" jumps to the box.
(function () {
  var input = document.querySelector(".search-input");
  var panel = document.querySelector(".search-results");
  if (!input || !panel) return;

  var index = null;
  var loading = false;
  var active = -1;
  var shownLinks = [];

  function load() {
    if (index || loading) return;
    loading = true;
    fetch(input.getAttribute("data-index"))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data.map(function (d) { return { title: d.title, url: d.url, text: d.text, lt: d.title.toLowerCase(), lx: d.text.toLowerCase() }; });
        run();
      })
      .catch(function () { loading = false; message("Search is unavailable right now."); });
  }

  function message(text) {
    panel.textContent = "";
    var p = document.createElement("p");
    p.className = "search-empty";
    p.textContent = text;
    panel.appendChild(p);
    panel.hidden = false;
  }

  function score(doc, terms) {
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var inTitle = doc.lt.indexOf(terms[i]) >= 0;
      var at = doc.lx.indexOf(terms[i]);
      if (!inTitle && at < 0) return -1;
      total += (inTitle ? 50 : 0) + (at >= 0 ? 10 / (1 + at / 2000) : 0);
    }
    return total;
  }

  // An excerpt around the first word found, with every word marked.
  function excerpt(doc, terms) {
    var at = -1;
    for (var i = 0; i < terms.length && at < 0; i++) at = doc.lx.indexOf(terms[i]);
    var start = Math.max(0, at - 60);
    var piece = (start > 0 ? "…" : "") + doc.text.substr(start, 170) + (start + 170 < doc.text.length ? "…" : "");
    var span = document.createElement("span");
    span.className = "r-text";
    var pattern = new RegExp("(" + terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "gi");
    var parts = piece.split(pattern);
    for (var j = 0; j < parts.length; j++) {
      if (j % 2 === 1) {
        var mark = document.createElement("mark");
        mark.textContent = parts[j];
        span.appendChild(mark);
      } else {
        span.appendChild(document.createTextNode(parts[j]));
      }
    }
    return span;
  }

  function run() {
    var query = input.value.trim().toLowerCase();
    if (!query) { panel.hidden = true; return; }
    if (!index) { load(); message("Loading the search index…"); return; }
    var terms = query.split(/\s+/).filter(Boolean);
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(index[i], terms);
      if (s >= 0) hits.push({ doc: index[i], s: s });
    }
    hits.sort(function (a, b) { return b.s - a.s; });
    if (!hits.length) { message("No pages match “" + input.value.trim() + "”."); return; }
    panel.textContent = "";
    shownLinks = [];
    active = -1;
    for (var k = 0; k < Math.min(hits.length, 12); k++) {
      var a = document.createElement("a");
      a.href = hits[k].doc.url;
      var title = document.createElement("span");
      title.className = "r-title";
      title.textContent = hits[k].doc.title;
      a.appendChild(title);
      a.appendChild(excerpt(hits[k].doc, terms));
      panel.appendChild(a);
      shownLinks.push(a);
    }
    panel.hidden = false;
  }

  function move(step) {
    if (!shownLinks.length) return;
    active = (active + step + shownLinks.length) % shownLinks.length;
    for (var i = 0; i < shownLinks.length; i++) shownLinks[i].classList.toggle("active", i === active);
    shownLinks[active].scrollIntoView({ block: "nearest" });
  }

  var timer = null;
  input.addEventListener("focus", load);
  input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 120); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter" && shownLinks.length) { e.preventDefault(); window.location.href = shownLinks[Math.max(active, 0)].href; }
    else if (e.key === "Escape") { panel.hidden = true; input.blur(); }
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".search")) panel.hidden = true; });
  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing) { e.preventDefault(); input.focus(); }
  });
})();
