# Memory Book: project notes

## What the app is for
A private book where a person writes short memories (title, date, mood and a few lines) and looks back on them.

## Main screens
- **Home** (`/`): a welcome section, a "Write a memory" button and the latest three memories.
- **Memories** (`/#/memories`): every memory, newest first.
- **New memory** (`/#/new`): a form to write a memory (title, date, mood, text). Submitting adds it to the top of the list and opens Memories.

## API endpoints
None yet. All memories are sample data in `src/data.js`.

## Trial state (not saved yet)
- The **New memory** form: a new memory only lasts until the page reloads. The screen shows "Not saved yet: upgrade to keep your changes". When saving turns on after upgrading, store new memories in the database and load them from there.
- The **Memories** list and the **Home** page read from the same in-page state (`src/App.jsx`), so they show new memories until reload.

## Decisions
- First version: a warm paper-and-brown look, with serif headings.
- Moods offered: Happy, Calm, Thoughtful, Excited, Sad.
