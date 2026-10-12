# Kairo Mixes

Kairo Mixes is a personal website for listening to my Drum & Bass mixes. It provides a dedicated home for full-length mixes, with audio hosted independently rather than limited by the upload restrictions of mainstream music platforms.

Visit the site at [mixes.doxxus.ca](https://mixes.doxxus.ca).

## What you can do

- Browse and play the mix collection.
- Control playback with the player or the shared previous, play/pause, and next controls.
- Adjust the global volume and choose whether a mix repeats or playback continues to the next mix.
- Open a mix's timestamped tracklist and see which tracks are currently playing.
- Use browser media controls where supported.

## Run locally

This project uses SvelteKit, Svelte, TypeScript, and Vite. Node.js 22 or newer is required.

```sh
npm install
npm run dev
```

To create a production build and preview it locally:

```sh
npm run build
npm run preview
```

## Mix data

Mix titles, cover art, and audio URLs are defined in `src/mixes.json`. Timestamped tracklists are defined in `src/tracklists.json`.

## TODO
- [ ] Make custom transport controls / audio player for each mix card.