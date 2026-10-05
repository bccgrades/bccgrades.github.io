const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

export const publicPath = (path: string) =>
	`${basePath}${path.startsWith("/") ? path : `/${path}`}`;
