import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();

function collectTemplateFiles(directory) {
	const entries = readdirSync(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const absolutePath = join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectTemplateFiles(absolutePath));
			continue;
		}

		if (entry.name.endsWith('.svelte') || entry.name.endsWith('.html')) {
			files.push(absolutePath);
		}
	}

	return files;
}

const files = collectTemplateFiles(join(root, 'src'));

const tagPattern = /<(div|span)(\s|>)|<\/(div|span)>/g;
const failures = [];

for (const absolutePath of files) {
	const source = readFileSync(absolutePath, 'utf8');
	if (tagPattern.test(source)) {
		failures.push(relative(root, absolutePath));
	}
}

if (failures.length > 0) {
	console.error('Template tags <div> and <span> are forbidden. Use custom elements such as <lefine-box> and <lefine-text>.');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}
