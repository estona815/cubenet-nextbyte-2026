# CubeNet

Draw six squares and trace how their faces map to a unit cube. CubeNet is a static browser tool with a 6×6 keyboard-accessible editor, fold diagnostics, a calculated three-face diagram, all six face mappings, and JSON export.

## Run

From this directory, run `python3 -m http.server 8765 --bind 127.0.0.1`, then open `http://127.0.0.1:8765/`. Any static HTTP server can serve these files. ES modules require HTTP in browsers that restrict local file imports. No build step, package installation, API key, account, or paid service is required. Runtime assets are local; no remote requests or analytics are implemented.

## Use

- **Cross** loads a valid example; **Rectangle** loads an inconsistent loop; **Clear** empties the editor.
- Arrow keys move grid focus, Home/End move within a row, and Enter/Space toggle a square.
- Select exactly six edge-connected squares. Count, connectivity, conflicting loop orientations, and repeated face directions have separate diagnostics.
- Open **Face mapping and diagnostic paths** to inspect every square or choose a different start square. Changing the start square rotates the reference axes and preserves validity.
- Direction controls highlight their mapped square. A valid result displays exactly three visible faces, calculated from the +Y, +Z, and +X mappings; all six mappings remain available as text.
- **Export trace** downloads the current calculation, including invalid results and limitations. Empty selection cannot be exported. Grid position labels are one-based; JSON coordinates are zero-based. Data stays in memory and refresh resets the Cross example.

## How the calculation works

`engine.mjs` assigns each square an integer right/up/normal basis. A breadth-first traversal applies quarter-turn rotations across shared edges. A previously reached square must have the same basis through every path. Disconnected squares, incompatible loop assignments, or two faces with the same normal prevent a valid result. Six consistent, distinct axis normals constitute the final unit-cube orientation check. Duplicate coordinate input is normalized to unique squares; the browser editor already maintains a unique selection.

`app.mjs` renders diagnostics, keyboard controls, mappings, the SVG diagram, and the actual JSON download. `index.html` and `style.css` provide the interface. There are no third-party runtime dependencies.

## Limits

This is a final orientation checker for unit squares, not a physical folding simulator. It does not model paper thickness, tabs, cutting templates, intermediate collisions, or a collision-free folding sequence. It makes no manufacturing or practical paper-testing claim. The editor is bounded to coordinates 0–5. Direct engine callers should use bounded integer coordinates; arbitrary large-number geometry and imported documents are outside the demonstrated interface. The diagram is illustrative projection of calculated final faces, not an animated fold.

## Tests and observed checks

Run `node --test test-engine.mjs` with a Node.js version that supports the built-in test runner. The eight tests independently generate 35 free hexominoes and calculate 11 valid nets, compare folds with an integer rotation oracle, check 24 right-handed bases and inverse folds, exercise all roots across planar symmetries and translations, and check invalid inputs. The classifier does not decide validity from the known count of 11. `node --check app.mjs` checks syntax.

Browser checks observed a valid Cross, Rectangle diagnostics without a success cube, clearing, keyboard selection and focus, start-square changes, an actual JSON download with six unique face normals, and a stacked 390×844 mobile layout without page-wide horizontal overflow. No warnings or errors were captured in those checks. These observations cover those workflows in the checked browser; they do not establish every browser, assistive technology, physical fold, or user outcome.

## AI assistance

OpenAI Codex assisted with the concept, implementation, tests, documentation, and review under participant instructions. AI image generation supplied the visual design reference; the functional diagram is calculated SVG rather than a generated image. This documentation does not claim unaided human authorship, participant code understanding, measured impact, or competition acceptance.

## Integrity

`manifest.json` lists the packaged source and documentation byte sizes and SHA-256 hashes. The manifest does not include its own hash.
