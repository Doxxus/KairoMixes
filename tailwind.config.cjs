/** @type {import('tailwindcss').Config}*/
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				'muddy-violet': '#302D3E',
				'dark-violet': '#0f041a',
				'translucent-violet': '#DAD5EA',
			},
		},
	},

	plugins: []
};

module.exports = config;
