# Date Proposal — HTML, CSS, and JavaScript

This is a plain browser version of the date-proposal app. It has no React or
build step; the page, styling, interactions, and date-planning flow are in
`index.html`, `styles.css`, and `script.js`. The `assets/` folder contains the
same media files used by the app.

## Run it

Serve this folder with a local web server and open its `index.html`. For example,
from this folder:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The proposal flow, date picker, custom vibes, outfit choices, countdown, sound
effects, and background music run in the browser. Creating and responding to a
shareable link still needs the project's API at `/api/proposals` and its
database. When hosted at the project's root, the API paths work as-is. If the
API is hosted on another origin, set `window.DATE_PROPOSAL_API_BASE` to that
origin before `script.js` loads.

## Media files

- `assets/bgmusic.mp3` — the 40-second music segment, looped by the player
- `assets/yes_main.mp3` — sound for the initial YES button
- `assets/fah.mp3` — sound for YES buttons in the confirmation popup
- `assets/cooked.mp4` — the “Damn I'm cooked” popup video
- `assets/letmetell-video.mp4` — the looping video in the third confirmation popup
- `assets/eminem-rose.png` — proposal image
