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
- **Piano** (`/#/piano`): a piano floor with two octaves under the jumping elephant. Drag the elephant so its feet touch a key: the key plays its exact pitch, and the elephant jumps to a random spot above the piano.
- **Account** (`/#/account`): sign up with a cowboy name, email, password and password confirmation, or sign in with email and password. After signing in, it shows a welcome and a Sign out button. Accounts are saved in the database, so creating one needs a paid workspace.
- **Bike shop help** (`/#/bike-shop`): a support agent for a bike shop. Customers type a question about repairs, prices or opening hours and get a reply from Gemini. It answers only from the shop facts in `backend/Services/BikeShopInfo.cs` (sample hours and repairs for now, to be replaced with the shop's real ones). Each question uses credits. The last 10 saved turns are sent with each question. Each browser is one customer: a random id kept in localStorage (`bikeShopCustomerId`) ties the saved conversation to it. The conversation is saved in the database, so it is still there on return. A "Start a new conversation" button clears it. Customers do not sign in, so the same customer on another device starts fresh; per-account memory across devices is not built yet.
- **About** (`/#/about`): a placeholder text until the owner writes their own story. Their background is not stored anywhere in the app; they supply the words themselves.
- **Beatles** (`/#/beatles`): a list of favorite Beatles songs, starting with three. Type a song title and press "Add song" to add it to the list. The list is kept in the page only, so it resets on reload.

## API endpoints
- `GET /api/maps/locate?address=...`: finds the address and returns its coordinates and full address. Found addresses are remembered in the backend, so repeat searches do not use credits again.
- `GET /api/maps/image?lat=...&lng=...`: a PNG map image with a marker at those coordinates.
- `GET /api/jokes/random`: asks Gemini for one short joke. Used by the "Tell me a joke" button on Home. Each click uses credits.
- `GET /api/dinner/ideas?ingredients=...`: asks Gemini for three dinner ideas from the listed fridge items (max 300 characters). Used by the "Suggest 3 dinners" section on Home. Each click uses credits.

- `GET /api/cowboys`: every row of the `cowboys` table (name, address, belt size, salary). Used by the **Cowboy game** page.
- `POST /api/cowboys/{id}/raise`: gives that cowboy a 10% raise in the database and returns the new salary. Used by the **Cowboy game** page on each click during the puff.
- `POST /api/auth/register` and `POST /api/auth/login`: create an account or sign in with email and password. Both return a sign-in token. `GET /api/auth/me` says who is signed in, from the token. No page uses these yet. Sign-ins reset whenever the backend restarts, because the signing key is made fresh at each start.
- `GET /api/candidates`: the 10 made-up candidates (name, headline, city, email). No page uses it yet.
- `POST /api/chat`: sends a question and the earlier turns to Gemini and returns one reply. Used by the **Chatbot** page. Each question uses credits.
- `POST /api/bike-shop/chat`: sends a customer question (with the customer id) and the customer's last 10 saved turns to Gemini, with the bike shop facts as context, returns one reply, and saves both messages. Used by the **Bike shop help** page. Each question uses credits.
- `GET /api/bike-shop/chat?customerId=...`: the customer's saved conversation, oldest first (up to 50). Used when the **Bike shop help** page opens.
- `DELETE /api/bike-shop/chat?customerId=...`: clears the customer's saved conversation. Used by "Start a new conversation".
- `POST /api/bike-shop/newsletter`: saves an email for the bike shop newsletter (once per address). Sends no emails. Used by the "Get news from the bike shop" sign-up at the bottom of the **Bike shop help** page.
- `GET /api/bike-shop/repair-bookings/today`: today's repair bookings (customer name, bike, service, time), earliest first. No page uses it yet.

Memories are still sample data in `src/data.js`.

## Database tables
- `cowboys` (id, name, address, belt_size, salary): created when the backend starts. When the table is empty it gets 50 sample rows, so restarts do not add more.
- `app_users` (id, email, password_hash, created_at): sign-up accounts. Passwords are stored only as hashes. Created when the backend starts.
- `bike_shop_messages` (id, customer_id, role, text, created_at): the bike shop conversations, one row per message. Created when the backend starts.
- `newsletter_signups` (id, email, created_at): bike shop newsletter emails, each address once. Created when the backend starts.
- `repair_bookings` (id, customer_name, bike, service, booking_date, booking_time): bike shop repair bookings. Created when the backend starts, with 3 sample bookings dated the day the table was created (the sample rows are only added while the table is empty). "Today" means the database's current date.
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
