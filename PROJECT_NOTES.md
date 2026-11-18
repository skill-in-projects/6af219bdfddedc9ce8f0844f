# Memory Book: project notes

## What the app is for
A private book where a person writes short memories (title, date, mood and a few lines) and looks back on them.

## Main screens
- **Home** (`/`): a welcome section, a "Write a memory" button, a "Tell me a joke" button that shows a one-line joke from Gemini, and the latest three memories. Under the joke, a grey 3D elephant jumps in place with a cowboy riding on its back (built from CSS boxes, no image; it stops moving for users who ask for less motion). Each landing makes a synthesized fart sound and a puff cloud from its back, and the elephant turns pink for a moment. Sound starts after the first click or key press on the page.
- **Home** also has a "What is for dinner?" section: type what is in the fridge, press "Suggest 3 dinners", and see three dinner ideas from Gemini. Each press uses credits.
- **Memories** (`/#/memories`): every memory, newest first.
- **New memory** (`/#/new`): a form to write a memory (title, date, mood, text). Submitting adds it to the top of the list and opens Memories.
- **Find on map** (`/#/map`): type an address, press "Show on map", and see the address with a map image and a red marker on it. The map image cannot be dragged or zoomed.
- **Cowboy game** (`/#/game`): pick a cowboy from a list (names and addresses from the cowboys table) and see their salary. The elephant jumps here too. Each click while its puff cloud is showing gives the chosen cowboy a 10% raise, saved in the database. With no cowboy chosen, the click shows "Choose a cowboy first."
- **Chatbot** (`/#/chat`): type a question and get a reply from Gemini. The chatbot's main topic is the digestive system of elephants, and it also answers other questions briefly. Each question uses credits. The last 10 turns are sent with each question so replies follow the conversation.
- **Beatles** (`/#/beatles`): a list of favorite Beatles songs, starting with three. Type a song title and press "Add song" to add it to the list. The list is kept in the page only, so it resets on reload.

## API endpoints
- `GET /api/maps/locate?address=...`: finds the address and returns its coordinates and full address. Found addresses are remembered in the backend, so repeat searches do not use credits again.
- `GET /api/maps/image?lat=...&lng=...`: a PNG map image with a marker at those coordinates.
- `GET /api/jokes/random`: asks Gemini for one short joke. Used by the "Tell me a joke" button on Home. Each click uses credits.
- `GET /api/dinner/ideas?ingredients=...`: asks Gemini for three dinner ideas from the listed fridge items (max 300 characters). Used by the "Suggest 3 dinners" section on Home. Each click uses credits.

- `GET /api/cowboys`: every row of the `cowboys` table (name, address, belt size, salary). Used by the **Cowboy game** page.
- `POST /api/cowboys/{id}/raise`: gives that cowboy a 10% raise in the database and returns the new salary. Used by the **Cowboy game** page on each click during the puff.
- `GET /api/candidates`: the 10 made-up candidates (name, headline, city, email). No page uses it yet.
- `POST /api/chat`: sends a question and the earlier turns to Gemini and returns one reply. Used by the **Chatbot** page. Each question uses credits.

Memories are still sample data in `src/data.js`.

## Database tables
- `cowboys` (id, name, address, belt_size, salary): created when the backend starts. When the table is empty it gets 50 sample rows, so restarts do not add more.
- `candidates` (id, full_name, headline, city, email), with `candidate_experiences`, `candidate_skills`, `candidate_education` and `candidate_certifications` linked to it. Shaped like a CV. Created when the backend starts, with 10 made-up people. The names, companies and schools are invented; no real person's details are stored.

## Trial state (not saved yet)
- The **New memory** form: a new memory only lasts until the page reloads. The screen shows "Not saved yet: upgrade to keep your changes". When saving turns on after upgrading, store new memories in the database and load them from there.
- The **Memories** list and the **Home** page read from the same in-page state (`src/App.jsx`), so they show new memories until reload.

## Decisions
- First version: a warm paper-and-brown look, with serif headings.
- Later: the user asked for a dark green background. Cards stay white; text on the background is cream (colors in `src/components/theme.js`).
- Moods offered: Happy, Calm, Thoughtful, Excited, Sad.
- Map page: the user asked for an address on a map. Only a static map image is possible here, so it is not interactive.
- Cowboys table: the user asked for a table named "cowbos" with 50 mock rows (name, address, belt size, salary). It is named `cowboys` (read as a typo).
