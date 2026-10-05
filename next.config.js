const withPwa = require("next-pwa")({
	dest: "public",
	register: true,
	skipWaiting: true,
});

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = withPwa({
	swcMinify: false,
	reactStrictMode: true,
	output: "export",
	trailingSlash: true,
	basePath,
	assetPrefix: basePath || undefined,
	images: {
		unoptimized: true,
	},
});

module.exports = nextConfig;
