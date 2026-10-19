import React from "react";
import { useRouter } from "next/router";

export default function NotFound() {
	const router = useRouter();

	React.useEffect(() => {
		if (window) {
			console.log(window.location.pathname);
			if (/^\/(?:[^/]+\/)?grades\/\d+\/?$/.test(window.location.pathname)) {
				router.replace("/grades");
			} else {
				router.push(window.location.pathname);
			}
		}
	}, [router]);

	return (
		<div className="p-5 md:p-10">
			<h1 className="dark:text-white font-bold text-4xl">
				404: Found Not Found
			</h1>
		</div>
	);
}
