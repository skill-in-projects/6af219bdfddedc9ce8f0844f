# Memory Book: project notes

## What the app is for
A private book where a person writes short memories (title, date, mood and a few lines) and looks back on them.

## Main screens
- **Home** (`/`): a welcome section, a "Write a memory" button, a "Tell me a joke" button that shows a one-line joke from Gemini, and the latest three memories.
- **Home** also has a "What is for dinner?" section: type what is in the fridge, press "Suggest 3 dinners", and see three dinner ideas from Gemini. Each press uses credits.
- **Memories** (`/#/memories`): every memory, newest first.
- **New memory** (`/#/new`): a form to write a memory (title, date, mood, text). Submitting adds it to the top of the list and opens Memories. A "Dictate" button under the Memory box adds spoken words to the text (browser speech recognition, Chrome and Edge only; no credits used).
- **Find on map** (`/#/map`): type an address, press "Show on map", and see the address with a map image and a red marker on it. The map image cannot be dragged or zoomed.
- **Shops** (`/#/shops`): type your own address, add shops (name and address) to a list, and press "Show walking times" to see the walking time from your address to each shop. Each shop's walking time is looked up once and remembered in the backend, so repeat checks do not use credits again. The shop list is not saved yet (it lasts until reload).

## API endpoints
- `GET /api/maps/locate?address=...`: finds the address and returns its coordinates and full address. Found addresses are remembered in the backend, so repeat searches do not use credits again.
- `GET /api/maps/image?lat=...&lng=...`: a PNG map image with a marker at those coordinates.
- `GET /api/jokes/random`: asks Gemini for one short joke. Used by the "Tell me a joke" button on Home. Each click uses credits.
- `GET /api/shops/walk-time?from=...&to=...`: the walking time in minutes between two addresses. Each new pair of addresses uses credits once; repeats are remembered in the backend.
- `GET /api/dinner/ideas?ingredients=...`: asks Gemini for three dinner ideas from the listed fridge items (max 300 characters). Used by the "Suggest 3 dinners" section on Home. Each click uses credits.

Memories are still sample data in `src/data.js`.

## Trial state (not saved yet)
- The **New memory** form: a new memory only lasts until the page reloads. The screen shows "Not saved yet: upgrade to keep your changes". When saving turns on after upgrading, store new memories in the database and load them from there.
- The **Memories** list and the **Home** page read from the same in-page state (`src/App.jsx`), so they show new memories until reload.

## Decisions
- First version: a warm paper-and-brown look, with serif headings.
- Moods offered: Happy, Calm, Thoughtful, Excited, Sad.
- Map page: the user asked for an address on a map. Only a static map image is possible here, so it is not interactive.
