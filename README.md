# Triplet

A Progressive Web App card game: spot three cards where every feature is either all the same or all different.

**Use it:** https://brian-borup.github.io/triplet/

On an iPhone, open that link in Safari and tap **Share → Add to Home Screen**. It then runs full-screen and works offline. Best scores are saved only on the device.

## Playing

Every card has four features, each with three options:

- **Number:** one, two or three symbols
- **Shape:** circle, triangle or square
- **Colour:** blue, red or green by default. Pick any three of eight colours under **Card colours** on the menu.
- **Fill:** solid, shaded or hollow

A **trio** is three cards where, for each feature, the cards are all the same or all different. Tap three cards to pick one. Twelve cards are on the table; if none of them make a trio, three more are dealt automatically.

- **Starter** uses 27 cards, all solid, so there are only three features to watch. Clear the deck as fast as you can.
- **Classic** uses the full 81-card deck. The game ends when the deck is empty and no trio is left on the table. Your time is the score.
- **Blitz** gives you 3 minutes to find as many trios as you can. The deck never runs out.

A wrong pick costs 5 seconds and tells you which feature broke the trio. **Hint** costs 15 seconds: the first tap marks one card of a trio, the second marks another card in the same trio. In Blitz, penalties come off your clock. **Shuffle** rearranges the cards on the table for a fresh look, free of charge. The menu has an option to show how many trios are on the table.

## Icons

The icons are drawn by `tools/make-icons.ps1` (Windows):

```
pwsh tools/make-icons.ps1
```

## Developing

Plain HTML, CSS and JavaScript, no build step.

```
node serve.js
```

then open http://localhost:8086. When you change any app file, bump `CACHE` in `sw.js` so installed copies pick up the update.
