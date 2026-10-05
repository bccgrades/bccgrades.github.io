import Document, { Html, Head, Main, NextScript } from "next/document";
import { publicPath } from "../lib/paths";

export default class MyDocument extends Document {
	render() {
		return (
			<Html>
				<Head>
					<link
						rel="icon"
						type="image/png"
						href={publicPath("/favicon.png")}
					/>
          <link
          	rel="manifest"
          	href={publicPath("/manifest.json")}
          />
          <link
          	rel="apple-touch-icon"
          	href={publicPath("/assets/icon.png")}
          />
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
