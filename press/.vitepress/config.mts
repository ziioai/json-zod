import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'json-zod',
	description: 'Powerful Utilities for LLMs',
	appearance: 'dark',

	base: '/json-zod/',
	outDir: '../docs',

	head: [
		['link', { rel: 'icon', href: '/json-zod/favicon.svg' }],
		[
			'link',
			{
				rel: 'apple-touch-icon',
				href: '/json-zod/apple-touch-icon.png',
			},
		],
	],

	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		logo: '/logo.svg',
		nav: [
			{ text: 'Home', link: '/' },
			// { text: 'Examples', link: '/markdown-examples' }
		],
		sidebar: [
			{
				text: 'Start',
				items: [{ text: 'Start', link: '/start' }],
			},
			{
				text: 'Utils',
				items: [{ text: 'Utils', link: '/Utils/utils' }],
			},
			{
				text: 'API Reference',
				items: [
					// { text: 'Runtime API Examples', link: '/api-examples' },
					{ text: 'API Reference', link: '/api' },
				],
			},
		],

		socialLinks: [
			{
				icon: 'github',
				link: 'https://github.com/ziioai/json-zod',
			},
		],
	},
});
