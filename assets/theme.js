// Snap Plugins sites: the light / dark switch, and a "#" link beside each section heading.
// Dark is the default; the visitor's choice is kept in localStorage, shared by every page under snap-plugins.github.io.
// Each layout sets the stored choice on <html> in its <head>, before the stylesheet paints.
(function () {
  var root = document.documentElement;
  var KEY = "snap-theme";

  function current() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function label(button) {
    var dark = current() === "dark";
    button.textContent = dark ? "☀ Light" : "☾ Dark";
    button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    button.setAttribute("aria-pressed", dark ? "false" : "true");
  }

  var button = document.querySelector(".theme-toggle");
  if (button) {
    button.hidden = false;
    label(button);
    button.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* storage blocked: the switch still works for this page */ }
      label(button);
    });
  }

  var headings = document.querySelectorAll(".content h2[id], .content h3[id], .content h4[id]");
  for (var i = 0; i < headings.length; i++) {
    var a = document.createElement("a");
    a.className = "heading-anchor";
    a.href = "#" + headings[i].id;
    a.setAttribute("aria-label", "Link to this section");
    a.textContent = "#";
    headings[i].appendChild(a);
  }
})();
