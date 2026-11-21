import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	
	preprocess: [vitePreprocess({})],

	kit: {
		adapter: adapter({ fallback: 'index.html' }),
		// The Android bundle is served from the root of its own origin, so its build sets BUNDLE_BUILD
		paths: { base: process.env.BUNDLE_BUILD ? '' : '/mixes' }
	}
};

export default config;
