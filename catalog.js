/* Plain script. Search and paging stay in the page, so the folder works opened from disk. */
(function () {
  var PAGE = 30;

  function text(value) {
    return value == null ? "" : String(value);
  }

  function mount(el) {
    var raw = document.getElementById(el.getAttribute("data-json"));
    if (!raw) return;
    var rows = JSON.parse(raw.textContent);
    var columns = JSON.parse(el.getAttribute("data-columns"));
    var keys = JSON.parse(el.getAttribute("data-search"));
    var facetKey = el.getAttribute("data-facet") || "";
    var facetLabel = el.getAttribute("data-facet-label") || "";
    var q = "";
    var facet = "all";
    var page = 0;

    var facets = [];
    if (facetKey) {
      var seen = {};
      rows.forEach(function (row) {
        var name = text(row[facetKey]);
        if (name && !seen[name]) {
          seen[name] = true;
          facets.push(name);
        }
      });
      facets.sort();
    }

    var bar = document.createElement("div");
    bar.className = "flex flex-col gap-2 sm:flex-row";
    var input = document.createElement("input");
    input.placeholder = "Search name, id, or skill";
    input.className = "h-11 flex-1 rounded-card border border-line bg-bark px-3 text-paper outline-none placeholder:text-muted";
    bar.appendChild(input);

    var select = null;
    if (facetKey) {
      var label = document.createElement("label");
      label.className = "flex h-11 items-center gap-2 rounded-card border border-line bg-bark px-3 text-sm";
      var span = document.createElement("span");
      span.className = "text-muted";
      span.textContent = facetLabel;
      select = document.createElement("select");
      select.className = "bg-bark text-paper outline-none";
      var all = document.createElement("option");
      all.value = "all";
      all.textContent = "All";
      select.appendChild(all);
      facets.forEach(function (name) {
        var opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });
      label.appendChild(span);
      label.appendChild(select);
      bar.appendChild(label);
    }

    var count = document.createElement("p");
    count.className = "text-sm text-muted";
    var tableWrap = document.createElement("div");
    var pager = document.createElement("div");
    pager.className = "flex items-center justify-between gap-3";

    el.className = "space-y-3";
    el.appendChild(bar);
    el.appendChild(count);
    el.appendChild(tableWrap);
    el.appendChild(pager);

    function draw() {
      var needle = q.trim().toLowerCase();
      var filtered = rows.filter(function (row) {
        if (facet !== "all" && facetKey && text(row[facetKey]) !== facet) return false;
        if (!needle) return true;
        return keys.some(function (key) {
          return text(row[key]).toLowerCase().indexOf(needle) !== -1;
        });
      });
      var pages = Math.max(1, Math.ceil(filtered.length / PAGE));
      if (page > pages - 1) page = pages - 1;
      var slice = filtered.slice(page * PAGE, page * PAGE + PAGE);
      count.textContent =
        filtered.length.toLocaleString() +
        " shown" +
        (filtered.length !== rows.length ? " of " + rows.length.toLocaleString() : "");

      tableWrap.innerHTML = "";
      if (!slice.length) {
        var empty = document.createElement("p");
        empty.className = "rounded-card border border-line bg-bark px-4 py-6 text-sm text-muted";
        empty.textContent = "Nothing matches.";
        tableWrap.appendChild(empty);
      } else {
        var wrap = document.createElement("div");
        wrap.className = "overflow-x-auto rounded-card border border-line";
        var table = document.createElement("table");
        table.className = "w-full min-w-2xl border-collapse text-left text-sm";
        var thead = document.createElement("thead");
        thead.className = "bg-bark text-bronze";
        var hr = document.createElement("tr");
        columns.forEach(function (col) {
          var th = document.createElement("th");
          th.className = "px-3 py-2 font-medium whitespace-nowrap";
          th.textContent = col.label;
          hr.appendChild(th);
        });
        thead.appendChild(hr);
        var tbody = document.createElement("tbody");
        slice.forEach(function (row) {
          var tr = document.createElement("tr");
          tr.className = "border-t border-line align-top odd:bg-panel/30";
          columns.forEach(function (col) {
            var td = document.createElement("td");
            td.className = "px-3 py-2 text-paper/90";
            td.textContent = text(row[col.key]);
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(thead);
        table.appendChild(tbody);
        wrap.appendChild(table);
        tableWrap.appendChild(wrap);
      }

      pager.innerHTML = "";
      if (pages > 1) {
        function button(label, disabled, next) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "h-11 rounded-card border border-line bg-bark px-4 text-sm disabled:opacity-40";
          b.textContent = label;
          b.disabled = disabled;
          b.addEventListener("click", function () {
            page = next;
            draw();
          });
          return b;
        }
        pager.appendChild(button("Previous", page === 0, page - 1));
        var mid = document.createElement("span");
        mid.className = "text-sm text-muted";
        mid.textContent = "Page " + (page + 1) + " of " + pages;
        pager.appendChild(mid);
        pager.appendChild(button("Next", page >= pages - 1, page + 1));
      }
    }

    input.addEventListener("input", function () {
      q = input.value;
      page = 0;
      draw();
    });
    if (select) {
      select.addEventListener("change", function () {
        facet = select.value;
        page = 0;
        draw();
      });
    }
    draw();
  }

  document.querySelectorAll("[data-catalog]").forEach(mount);
})();
