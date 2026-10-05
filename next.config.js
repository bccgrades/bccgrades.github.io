const withPwa = require("next-pwa")({
	dest: "public",
	register: true,
	skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = withPwa({
	swcMinify: false,
	reactStrictMode: true,
	output: "export",
	trailingSlash: true,
	basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
	assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
	images: {
		unoptimized: true,
	},
});

module.exports = nextConfig;
