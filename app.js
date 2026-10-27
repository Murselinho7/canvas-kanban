(function () {
  "use strict";

  var STORAGE_KEY = "canvas-kanban-v1";
  var COLUMNS = [
    { id: "backlog", title: "Backlog", accent: "var(--backlog)" },
    { id: "progress", title: "In Progress", accent: "var(--progress)" },
    { id: "done", title: "Done", accent: "var(--done)" }
  ];

  var board = load();
  var boardEl = document.getElementById("board");
  var statusEl = document.getElementById("status");
  var fileEl = document.getElementById("file");

  document.getElementById("export").addEventListener("click", exportMarkdown);
  document.getElementById("import").addEventListener("click", function () {
    fileEl.click();
  });
  fileEl.addEventListener("change", function () {
    var file = fileEl.files && fileEl.files[0];
    fileEl.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      importMarkdown(String(reader.result || ""));
    };
    reader.onerror = function () {
      setStatus("Could not read that file.");
    };
    reader.readAsText(file);
  });

  render();
  if (cardCount()) {
    var restored = cardCount();
    setStatus(restored === 1 ? "1 card saved in this browser." : restored + " cards saved in this browser.");
  }

  function load() {
    var fresh = emptyBoard();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fresh;
      var parsed = JSON.parse(raw);
      COLUMNS.forEach(function (column) {
        var cards = parsed[column.id];
        if (!Array.isArray(cards)) return;
        fresh[column.id] = cards.filter(function (card) {
          return card && typeof card.id === "string" && typeof card.text === "string" && card.text.trim();
        }).map(function (card) {
          return { id: card.id, text: card.text };
        });
      });
    } catch (err) {
      return emptyBoard();
    }
    return fresh;
  }

  function emptyBoard() {
    return { backlog: [], progress: [], done: [] };
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    var total = cardCount();
    setStatus(total === 1 ? "1 card saved in this browser." : total + " cards saved in this browser.");
  }

  function cardCount() {
    return COLUMNS.reduce(function (sum, column) {
      return sum + board[column.id].length;
    }, 0);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function render() {
    boardEl.textContent = "";
    COLUMNS.forEach(function (column) {
      boardEl.appendChild(renderColumn(column));
    });
  }

  function renderColumn(column) {
    var section = document.createElement("section");
    section.className = "column";
    section.dataset.column = column.id;
    section.style.setProperty("--accent", column.accent);

    var header = document.createElement("header");
    var title = document.createElement("h2");
    title.textContent = column.title;
    var count = document.createElement("span");
    count.className = "count";
    count.textContent = String(board[column.id].length);
    header.appendChild(title);
    header.appendChild(count);

    var list = document.createElement("div");
    list.className = "cards";
    if (!board[column.id].length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Drop a card here.";
      list.appendChild(empty);
    }
    board[column.id].forEach(function (card) {
      list.appendChild(renderCard(card));
    });

    var form = document.createElement("form");
    form.className = "composer";
    var input = document.createElement("input");
    input.type = "text";
    input.maxLength = 240;
    input.placeholder = "New card";
    input.setAttribute("aria-label", "New card in " + column.title);
    var add = document.createElement("button");
    add.type = "submit";
    add.textContent = "Add";
    form.appendChild(input);
    form.appendChild(add);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      board[column.id].push({ id: uid(), text: text });
      save();
      render();
    });

    section.appendChild(header);
    section.appendChild(list);
    section.appendChild(form);
    bindDrop(section, column.id);
    return section;
  }

  function renderCard(card) {
    var article = document.createElement("article");
    article.className = "card";
    article.draggable = true;
    article.dataset.id = card.id;

    var text = document.createElement("p");
    text.textContent = card.text;
    text.title = "Double-click to edit";
    text.addEventListener("dblclick", function () {
      beginEdit(article, card);
    });

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Delete " + card.text);
    remove.addEventListener("click", function () {
      removeCard(card.id);
    });

    article.appendChild(text);
    article.appendChild(remove);
    article.addEventListener("dragstart", function (event) {
      if (event.target.closest("button, input")) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData("text/plain", card.id);
      event.dataTransfer.effectAllowed = "move";
      article.classList.add("dragging");
    });
    article.addEventListener("dragend", function () {
      article.classList.remove("dragging");
      clearOver();
    });
    return article;
  }

  function beginEdit(article, card) {
    var input = document.createElement("input");
    input.type = "text";
    input.value = card.text;
    input.maxLength = 240;
    var paragraph = article.querySelector("p");
    article.replaceChild(input, paragraph);
    input.focus();
    input.select();

    var closed = false;
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
    });
    input.addEventListener("blur", function () {
      finish(true);
    });

    function finish(commit) {
      if (closed) return;
      closed = true;
      var next = input.value.trim();
      if (commit && next) card.text = next;
      if (!card.text.trim()) removeCard(card.id);
      else {
        save();
        render();
      }
    }
  }

  function bindDrop(section, columnId) {
    section.addEventListener("dragover", function (event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      section.classList.add("over");
    });
    section.addEventListener("dragleave", function (event) {
      if (!section.contains(event.relatedTarget)) section.classList.remove("over");
    });
    section.addEventListener("drop", function (event) {
      event.preventDefault();
      var id = event.dataTransfer.getData("text/plain");
      if (!id) return;
      var node = event.target && event.target.nodeType === 1 ? event.target : event.target.parentElement;
      var target = node && node.closest ? node.closest(".card") : null;
      var beforeId = target ? target.dataset.id : null;
      moveCard(id, columnId, beforeId);
    });
  }

  function moveCard(id, columnId, beforeId) {
    var located = takeCard(id);
    if (!located) return;
    var cards = board[columnId];
    var index = cards.length;
    if (beforeId && beforeId !== id) {
      var beforeIndex = cards.findIndex(function (card) { return card.id === beforeId; });
      if (beforeIndex >= 0) index = beforeIndex;
    }
    cards.splice(index, 0, located.card);
    save();
    render();
  }

  function takeCard(id) {
    for (var i = 0; i < COLUMNS.length; i += 1) {
      var cards = board[COLUMNS[i].id];
      var index = cards.findIndex(function (card) { return card.id === id; });
      if (index >= 0) return { card: cards.splice(index, 1)[0] };
    }
    return null;
  }

  function removeCard(id) {
    takeCard(id);
    save();
    render();
  }

  function clearOver() {
    var columns = boardEl.querySelectorAll(".column.over");
    Array.prototype.forEach.call(columns, function (column) {
      column.classList.remove("over");
    });
  }

  function exportMarkdown() {
    var markdown = toMarkdown(board);
    var blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "TODO.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Downloaded TODO.md.");
  }

  function importMarkdown(text) {
    var next = parseMarkdown(text);
    var total = COLUMNS.reduce(function (sum, column) {
      return sum + next[column.id].length;
    }, 0);
    if (!total) {
      setStatus("No tasks found. Use ## Backlog, ## In Progress, and ## Done.");
      return;
    }
    board = next;
    save();
    render();
  }

  function toMarkdown(source) {
    var lines = ["# TODO", ""];
    COLUMNS.forEach(function (column) {
      lines.push("## " + column.title, "");
      source[column.id].forEach(function (card) {
        var box = column.id === "done" ? "x" : " ";
        lines.push("- [" + box + "] " + oneLine(card.text));
      });
      lines.push("");
    });
    return lines.join("\n");
  }

  function oneLine(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function parseMarkdown(text) {
    var next = emptyBoard();
    var columnId = "backlog";
    var useHeadings = hasColumnHeading(text);
    String(text).split(/\r?\n/).forEach(function (line) {
      var heading = /^#{1,6}\s+(.+?)\s*$/.exec(line);
      if (heading) {
        var mapped = columnIdFor(heading[1]);
        if (mapped) columnId = mapped;
        return;
      }
      var item = /^\s*[-*]\s+\[([ xX])\]\s+(.+?)\s*$/.exec(line);
      if (item) {
        var destination = useHeadings ? columnId : (item[1].toLowerCase() === "x" ? "done" : "backlog");
        next[destination].push({ id: uid(), text: item[2] });
        return;
      }
      var plain = /^\s*[-*]\s+(.+?)\s*$/.exec(line);
      if (!plain) return;
      next[columnId].push({ id: uid(), text: plain[1] });
    });
    return next;
  }

  function hasColumnHeading(text) {
    return String(text).split(/\r?\n/).some(function (line) {
      var heading = /^#{1,6}\s+(.+?)\s*$/.exec(line);
      return Boolean(heading && columnIdFor(heading[1]));
    });
  }

  function columnIdFor(title) {
    var name = title.trim().toLowerCase();
    if (name === "backlog" || name === "todo" || name === "to do") return "backlog";
    if (name === "in progress" || name === "in-progress" || name === "doing") return "progress";
    if (name === "done" || name === "complete" || name === "completed") return "done";
    return null;
  }
})();
