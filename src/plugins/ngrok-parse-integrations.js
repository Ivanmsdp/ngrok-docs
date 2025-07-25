import fs from "node:fs";
import path from "node:path";
import * as utils from "@docusaurus/utils";

export default (context, options) => ({
	name: "ngrok-parse-integrations",
	async contentLoaded({ actions }) {
		const { setGlobalData } = actions;
		const integrationsDir = path.join(context.siteDir, "docs", "integrations");
		const integrations = [];

		const dir = await fs.promises.opendir(integrationsDir);
		for await (const dirent of dir) {
			if (dirent.name.includes("shared")) {
				// Skip the shared directory
				continue;
			}
			const integrationDir = path.join(integrationsDir, dirent.name);

			const isFile = fs.lstatSync(integrationDir).isFile();
			if (isFile) {
				continue;
			}

			const integration = {
				name: dirent.name,
				path: path.join(
					context.siteConfig.baseUrl,
					"integrations",
					dirent.name,
				),
				docs: [],
			};

			fs.readdirSync(integrationDir).flatMap(async (x) => {
				const filePath = path.join(integrationDir, x);

				// Ignore index files, folders, files that start with _, and non-markdown files
				const isFile = fs.lstatSync(filePath).isFile();
				if (!isFile || x.indexOf(".md") < 0 || x.startsWith("_")) {
					return;
				}

				// Parse markdown
				const fileContent = fs.readFileSync(filePath).toString();
				const fileMarkdown = await utils.parseMarkdownFile({
					filePath,
					fileContent,
					parseFrontMatter: utils.DEFAULT_PARSE_FRONT_MATTER,
				});

				// Add file details as metadata information on integration
				if (x === "index.mdx") {
					integration.metadata = fileMarkdown.frontMatter;
					return;
				}

				// Add file details as doc on integration
				integration.docs.push({
					// clean up things like .md
					path: path.join(integration.path, utils.fileToPath(x)),
					...fileMarkdown,
				});
			});
			integrations.push(integration);
		}

		setGlobalData(integrations.sort((a, b) => a.name.localeCompare(b.name)));
	},
});
