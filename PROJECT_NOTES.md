# Memory Book: project notes

## What the app is for
A private book where a person writes short memories (title, date, mood and a few lines) and looks back on them.

## Main screens
- **Home** (`/`): a welcome section, a "Write a memory" button, a "Tell me a joke" button that shows a one-line joke from Gemini, and the latest three memories. Under the joke, a grey 3D elephant jumps in place (built from CSS boxes, no image; it stops moving for users who ask for less motion).
- **Home** also has a "What is for dinner?" section: type what is in the fridge, press "Suggest 3 dinners", and see three dinner ideas from Gemini. Each press uses credits.
- **Memories** (`/#/memories`): every memory, newest first.
- **New memory** (`/#/new`): a form to write a memory (title, date, mood, text). Submitting adds it to the top of the list and opens Memories.
- **Find on map** (`/#/map`): type an address, press "Show on map", and see the address with a map image and a red marker on it. The map image cannot be dragged or zoomed.
- **Beatles** (`/#/beatles`): a list of favorite Beatles songs, starting with three. Type a song title and press "Add song" to add it to the list. The list is kept in the page only, so it resets on reload.

## API endpoints
- `GET /api/maps/locate?address=...`: finds the address and returns its coordinates and full address. Found addresses are remembered in the backend, so repeat searches do not use credits again.
- `GET /api/maps/image?lat=...&lng=...`: a PNG map image with a marker at those coordinates.
- `GET /api/jokes/random`: asks Gemini for one short joke. Used by the "Tell me a joke" button on Home. Each click uses credits.
- `GET /api/dinner/ideas?ingredients=...`: asks Gemini for three dinner ideas from the listed fridge items (max 300 characters). Used by the "Suggest 3 dinners" section on Home. Each click uses credits.

Memories are still sample data in `src/data.js`.

## Trial state (not saved yet)
- The **New memory** form: a new memory only lasts until the page reloads. The screen shows "Not saved yet: upgrade to keep your changes". When saving turns on after upgrading, store new memories in the database and load them from there.
- The **Memories** list and the **Home** page read from the same in-page state (`src/App.jsx`), so they show new memories until reload.

## Decisions
- First version: a warm paper-and-brown look, with serif headings.
- Later: the user asked for a dark green background. Cards stay white; text on the background is cream (colors in `src/components/theme.js`).
- Moods offered: Happy, Calm, Thoughtful, Excited, Sad.
- Map page: the user asked for an address on a map. Only a static map image is possible here, so it is not interactive.
