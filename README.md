# Canvas Kanban

![HTML](https://img.shields.io/badge/html-css-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-vanilla-F7DF1E?logo=javascript&logoColor=111)
![Storage](https://img.shields.io/badge/storage-localStorage-0F766E)
![Install](https://img.shields.io/badge/install-none-success)
![License](https://img.shields.io/badge/license-MIT-blue)

A three-column board that runs from the files in this folder. No framework, no package install, no server. Open `index.html` in a browser. Cards move with the HTML5 drag-and-drop API, stay in `localStorage` under the key `canvas-kanban-v1`, and round-trip through a `TODO.md` file.

## Open

Double-click `index.html`, or serve the folder:

```bash
cd 10-canvas-kanban
python -m http.server 8080
```

Then open `http://127.0.0.1:8080/`.

The board has **Backlog**, **In Progress**, and **Done**. Type in a column's box and press Add. Drag a card by its body onto another column, or onto another card to place it above that card. Double-click a card to rename it. The `×` button deletes it. The status line confirms the save.

## TODO.md

**Export TODO.md** downloads the board as Markdown:

```markdown
# TODO

## Backlog

- [ ] Write the brief

## In Progress

- [ ] Draft the layout

## Done

- [x] Open the board
```

**Import Markdown** reads a `.md` file back onto the board and replaces the current cards. Recognized headings are `Backlog`, `To Do`, `In Progress`, `Doing`, `Done`, and `Completed`. A file with no column headings still imports: `- [ ]` items land in Backlog and `- [x]` items land in Done. Plain `- item` lines follow the heading above them.

## GitHub Pages

1. Push this folder as the repository root, so `index.html` sits at the top of the repo.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch and the `/ (root)` folder. Save.
5. After the workflow finishes, the board is at `https://<user>.github.io/<repository>/`.

If this folder lives inside a larger repo, move these three files (`index.html`, `style.css`, `app.js`) to the directory Pages serves, or set the Pages source to that directory. The page only requests those relative files. Nothing is loaded from a CDN.
