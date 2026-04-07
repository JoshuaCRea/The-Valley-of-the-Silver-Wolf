# JoshuaCRea.github.io

Static GitHub Pages site for the React game "Valley of the Silver Wolf."

Lore:
- City-to-element canon:
  - `Pouch` = `Wood`
  - `Fangmarsh` = `Fire`
  - `Leap-Creek` = `Water`
  - `Blackstone` = `Metal`
  - `Underclaw` = `Earth`
- Each city's special 10th combat card should reflect that city's elemental theme, but the move name does not need to use the literal element word.
- Current special-card canon:
  - `Pouch` = `Splintered Step`
  - `Leap-Creek` = `Hidden Whirlpool`
  - `Fangmarsh` = `Billowing Rush`
  - `Blackstone` = `Tempered Veil`
  - `Underclaw` = `Smothering Soil`

Project Direction:
- The current repo is a prototype for a future standalone, self-contained online multiplayer game.
- Each match is intended to support `3-5` players.
- Players will sign in with persistent accounts.
- One player will create a private lobby and other players will join it.
- In the lobby, each player will claim a unique home city before the host starts the game.
- The long-term direction is a real-time hybrid experience with live board play and live combat, not a strictly single-active-player turn loop.

Files:
- `index.html` loads the page shell and CDN React scripts.
- `app.js` is the ES module entry point.
- `src/gameApp.js` contains the main React game UI and turn logic.
- `src/gameData.js` contains track data, player setup, and shared helpers.
- `styles.css` contains the game styling.
- `WHITE_DIE.md` defines the White Die used in the game's custom rules.

White Die:
- `1` = Wolf
- `6` = Star
- `2`, `3`, `4`, `5` = blank

Deployment:
- Push to the `main` branch of this `username.github.io` repository.
- GitHub Pages can serve this directly; no build step is required.
