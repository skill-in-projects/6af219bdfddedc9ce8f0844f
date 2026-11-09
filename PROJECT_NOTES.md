# Memory Book: project notes

## What the app is for
A private book where a person writes short memories (title, date, mood and a few lines) and looks back on them.

## Main screens
- **Home** (`/`): a welcome section, a "Write a memory" button and the latest three memories.
- **Memories** (`/#/memories`): every memory, newest first.
- **New memory** (`/#/new`): a form to write a memory (title, date, mood, text). Submitting adds it to the top of the list and opens Memories.
- **Find on map** (`/#/map`): type an address, press "Show on map", and see the address with a map image and a red marker on it. The map image cannot be dragged or zoomed.

## API endpoints
- `GET /api/maps/locate?address=...`: finds the address and returns its coordinates and full address. Found addresses are remembered in the backend, so repeat searches do not use credits again.
- `GET /api/maps/image?lat=...&lng=...`: a PNG map image with a marker at those coordinates.

Memories are still sample data in `src/data.js`.

## Trial state (not saved yet)
- The **New memory** form: a new memory only lasts until the page reloads. The screen shows "Not saved yet: upgrade to keep your changes". When saving turns on after upgrading, store new memories in the database and load them from there.
- The **Memories** list and the **Home** page read from the same in-page state (`src/App.jsx`), so they show new memories until reload.

## Decisions
- First version: a warm paper-and-brown look, with serif headings.
- Moods offered: Happy, Calm, Thoughtful, Excited, Sad.
- Map page: the user asked for an address on a map. Only a static map image is possible here, so it is not interactive.
