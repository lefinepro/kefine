import { P as head, S as escape_html, U as store_get, Z as attr_class, V as unsubscribe_stores, R as derived, Q as attr, _ as ensure_array_like, $ as attr_style, a0 as onDestroy, a1 as attributes, a2 as html, a3 as clsx$1, O as writable, a4 as get } from './exports-CoBtNwQi.js';
import { a as readBrowserPublicRuntimeConfig, r as resolvePublicRuntimeConfig } from './public-config-CCusQZMd.js';
import { p as page } from './state-D5a0yXnN.js';
import 'node:module';
import { g as getLocaleText, k as kefineLocale, s as setKefineLocale } from './kefine-locale-Dc0dhHaI.js';
import '@simplewebauthn/browser';

readBrowserPublicRuntimeConfig().app.reownProjectId;
async function ensureAppKit() {}
async function disconnectAppKit() {
	await (await ensureAppKit())?.disconnect?.();
}

//#region src/lib/order-proxy-path.ts
var DEFAULT_ORDER_PROXY_BASE_PATH = "";
function normalizeProxyBasePath(value) {
	const trimmed = value.trim();
	if (!trimmed || trimmed === "/") return "";
	if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
	return (trimmed.startsWith("/") ? trimmed : `/${trimmed}`).replace(/\/+$/, "");
}
function resolveOrderProxyBasePath(value) {
	if (typeof value === "string") return normalizeProxyBasePath(value);
	return normalizeProxyBasePath(DEFAULT_ORDER_PROXY_BASE_PATH);
}
function buildOrderProxyUrl(pathname, basePath) {
	const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
	return `${resolveOrderProxyBasePath(basePath)}${normalizedPath}`;
}
//#endregion
//#region src/lib/auth/passkey-session.ts
var PASSKEY_SESSION_KEY = "kefine-passkey-session";
var passkeySessionStore = writable(null);
function clearPasskeySession() {
	if (typeof window !== "undefined") localStorage.removeItem(PASSKEY_SESSION_KEY);
	passkeySessionStore.set(null);
}
//#endregion
//#region src/lib/auth/session.ts
var WALLET_SESSION_KEY = "auth-session";
function clearSession() {
	clearWalletSession();
	clearPasskeySession();
}
function clearWalletSession() {
	if (typeof window === "undefined") return;
	try {
		localStorage.removeItem(WALLET_SESSION_KEY);
	} catch {}
}
//#endregion
//#region src/lib/auth/auth-store.svelte.ts
var initialState = {
	isConnected: false,
	address: null,
	chainId: null,
	email: null,
	authType: null,
	status: null
};
var authState = { ...initialState };
function clearAuthState() {
	Object.assign(authState, initialState);
	clearSession();
}
//#endregion
//#region node_modules/@iconify/svelte/dist/functions.js
/**
* Expression to test part of icon name.
*
* Used when loading icons from Iconify API due to project naming convension.
* Ignored when using custom icon sets - convension does not apply.
*/
var matchIconName = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/**
* Convert string icon name to IconifyIconName object.
*/
var stringToIcon = (value, validate, allowSimpleName, provider = "") => {
	const colonSeparated = value.split(":");
	if (value.slice(0, 1) === "@") {
		if (colonSeparated.length < 2 || colonSeparated.length > 3) return null;
		provider = colonSeparated.shift().slice(1);
	}
	if (colonSeparated.length > 3 || !colonSeparated.length) return null;
	if (colonSeparated.length > 1) {
		const name$1 = colonSeparated.pop();
		const prefix = colonSeparated.pop();
		const result = {
			provider: colonSeparated.length > 0 ? colonSeparated[0] : provider,
			prefix,
			name: name$1
		};
		return validate && !validateIconName(result) ? null : result;
	}
	const name = colonSeparated[0];
	const dashSeparated = name.split("-");
	if (dashSeparated.length > 1) {
		const result = {
			provider,
			prefix: dashSeparated.shift(),
			name: dashSeparated.join("-")
		};
		return validate && !validateIconName(result) ? null : result;
	}
	if (allowSimpleName && provider === "") {
		const result = {
			provider,
			prefix: "",
			name
		};
		return validate && !validateIconName(result, allowSimpleName) ? null : result;
	}
	return null;
};
/**
* Check if icon is valid.
*
* This function is not part of stringToIcon because validation is not needed for most code.
*/
var validateIconName = (icon, allowSimpleName) => {
	if (!icon) return false;
	return !!((allowSimpleName && icon.prefix === "" || !!icon.prefix) && !!icon.name);
};
/**
* Resolve icon set icons
*
* Returns parent icon for each icon
*/
function getIconsTree(data, names) {
	const icons = data.icons;
	const aliases = data.aliases || Object.create(null);
	const resolved = Object.create(null);
	function resolve(name) {
		if (icons[name]) return resolved[name] = [];
		if (!(name in resolved)) {
			resolved[name] = null;
			const parent = aliases[name] && aliases[name].parent;
			const value = parent && resolve(parent);
			if (value) resolved[name] = [parent].concat(value);
		}
		return resolved[name];
	}
	Object.keys(icons).concat(Object.keys(aliases)).forEach(resolve);
	return resolved;
}
/** Default values for dimensions */
var defaultIconDimensions = Object.freeze({
	left: 0,
	top: 0,
	width: 16,
	height: 16
});
/** Default values for transformations */
var defaultIconTransformations = Object.freeze({
	rotate: 0,
	vFlip: false,
	hFlip: false
});
/** Default values for all optional IconifyIcon properties */
var defaultIconProps = Object.freeze({
	...defaultIconDimensions,
	...defaultIconTransformations
});
/** Default values for all properties used in ExtendedIconifyIcon */
var defaultExtendedIconProps = Object.freeze({
	...defaultIconProps,
	body: "",
	hidden: false
});
/**
* Merge transformations
*/
function mergeIconTransformations(obj1, obj2) {
	const result = {};
	if (!obj1.hFlip !== !obj2.hFlip) result.hFlip = true;
	if (!obj1.vFlip !== !obj2.vFlip) result.vFlip = true;
	const rotate = ((obj1.rotate || 0) + (obj2.rotate || 0)) % 4;
	if (rotate) result.rotate = rotate;
	return result;
}
/**
* Merge icon and alias
*
* Can also be used to merge default values and icon
*/
function mergeIconData(parent, child) {
	const result = mergeIconTransformations(parent, child);
	for (const key in defaultExtendedIconProps) if (key in defaultIconTransformations) {
		if (key in parent && !(key in result)) result[key] = defaultIconTransformations[key];
	} else if (key in child) result[key] = child[key];
	else if (key in parent) result[key] = parent[key];
	return result;
}
/**
* Get icon data, using prepared aliases tree
*/
function internalGetIconData(data, name, tree) {
	const icons = data.icons;
	const aliases = data.aliases || Object.create(null);
	let currentProps = {};
	function parse(name$1) {
		currentProps = mergeIconData(icons[name$1] || aliases[name$1], currentProps);
	}
	parse(name);
	tree.forEach(parse);
	return mergeIconData(data, currentProps);
}
/**
* Extract icons from an icon set
*
* Returns list of icons that were found in icon set
*/
function parseIconSet(data, callback) {
	const names = [];
	if (typeof data !== "object" || typeof data.icons !== "object") return names;
	if (data.not_found instanceof Array) data.not_found.forEach((name) => {
		callback(name, null);
		names.push(name);
	});
	const tree = getIconsTree(data);
	for (const name in tree) {
		const item = tree[name];
		if (item) {
			callback(name, internalGetIconData(data, name, item));
			names.push(name);
		}
	}
	return names;
}
/**
* Optional properties
*/
var optionalPropertyDefaults = {
	provider: "",
	aliases: {},
	not_found: {},
	...defaultIconDimensions
};
/**
* Check props
*/
function checkOptionalProps(item, defaults) {
	for (const prop in defaults) if (prop in item && typeof item[prop] !== typeof defaults[prop]) return false;
	return true;
}
/**
* Validate icon set, return it as IconifyJSON on success, null on failure
*
* Unlike validateIconSet(), this function is very basic.
* It does not throw exceptions, it does not check metadata, it does not fix stuff.
*/
function quicklyValidateIconSet(obj) {
	if (typeof obj !== "object" || obj === null) return null;
	const data = obj;
	if (typeof data.prefix !== "string" || !obj.icons || typeof obj.icons !== "object") return null;
	if (!checkOptionalProps(obj, optionalPropertyDefaults)) return null;
	const icons = data.icons;
	for (const name in icons) {
		const icon = icons[name];
		if (!name || typeof icon.body !== "string" || !checkOptionalProps(icon, defaultExtendedIconProps)) return null;
	}
	const aliases = data.aliases || Object.create(null);
	for (const name in aliases) {
		const icon = aliases[name];
		const parent = icon.parent;
		if (!name || typeof parent !== "string" || !icons[parent] && !aliases[parent] || !checkOptionalProps(icon, defaultExtendedIconProps)) return null;
	}
	return data;
}
/**
* Storage by provider and prefix
*/
var dataStorage = Object.create(null);
/**
* Create new storage
*/
function newStorage(provider, prefix) {
	return {
		provider,
		prefix,
		icons: Object.create(null),
		missing: /* @__PURE__ */ new Set()
	};
}
/**
* Get storage for provider and prefix
*/
function getStorage(provider, prefix) {
	const providerStorage = dataStorage[provider] || (dataStorage[provider] = Object.create(null));
	return providerStorage[prefix] || (providerStorage[prefix] = newStorage(provider, prefix));
}
/**
* Add icon set to storage
*
* Returns array of added icons
*/
function addIconSet(storage, data) {
	if (!quicklyValidateIconSet(data)) return [];
	return parseIconSet(data, (name, icon) => {
		if (icon) storage.icons[name] = icon;
		else storage.missing.add(name);
	});
}
/**
* Add icon to storage
*/
function addIconToStorage(storage, name, icon) {
	try {
		if (typeof icon.body === "string") {
			storage.icons[name] = { ...icon };
			return true;
		}
	} catch (err) {}
	return false;
}
/**
* Allow storing icons without provider or prefix, making it possible to store icons like "home"
*/
var simpleNames = false;
function allowSimpleNames(allow) {
	if (typeof allow === "boolean") simpleNames = allow;
	return simpleNames;
}
/**
* Get icon data
*
* Returns:
* - IconifyIcon on success, object directly from storage so don't modify it
* - null if icon is marked as missing (returned in `not_found` property from API, so don't bother sending API requests)
* - undefined if icon is missing in storage
*/
function getIconData(name) {
	const icon = typeof name === "string" ? stringToIcon(name, true, simpleNames) : name;
	if (icon) {
		const storage = getStorage(icon.provider, icon.prefix);
		const iconName = icon.name;
		return storage.icons[iconName] || (storage.missing.has(iconName) ? null : void 0);
	}
}
/**
* Add one icon
*/
function addIcon(name, data) {
	const icon = stringToIcon(name, true, simpleNames);
	if (!icon) return false;
	const storage = getStorage(icon.provider, icon.prefix);
	if (data) return addIconToStorage(storage, icon.name, data);
	else {
		storage.missing.add(icon.name);
		return true;
	}
}
/**
* Add icon set
*/
function addCollection(data, provider) {
	if (typeof data !== "object") return false;
	if (typeof provider !== "string") provider = data.provider || "";
	if (simpleNames && !provider && !data.prefix) {
		let added = false;
		if (quicklyValidateIconSet(data)) {
			data.prefix = "";
			parseIconSet(data, (name, icon) => {
				if (addIcon(name, icon)) added = true;
			});
		}
		return added;
	}
	const prefix = data.prefix;
	if (!validateIconName({
		prefix,
		name: "a"
	})) return false;
	return !!addIconSet(getStorage(provider, prefix), data);
}
/**
* Default icon customisations values
*/
var defaultIconSizeCustomisations = Object.freeze({
	width: null,
	height: null
});
var defaultIconCustomisations = Object.freeze({
	...defaultIconSizeCustomisations,
	...defaultIconTransformations
});
/**
* Regular expressions for calculating dimensions
*/
var unitsSplit = /(-?[0-9.]*[0-9]+[0-9.]*)/g;
var unitsTest = /^-?[0-9.]*[0-9]+[0-9.]*$/g;
function calculateSize(size, ratio, precision) {
	if (ratio === 1) return size;
	precision = precision || 100;
	if (typeof size === "number") return Math.ceil(size * ratio * precision) / precision;
	if (typeof size !== "string") return size;
	const oldParts = size.split(unitsSplit);
	if (oldParts === null || !oldParts.length) return size;
	const newParts = [];
	let code = oldParts.shift();
	let isNumber = unitsTest.test(code);
	while (true) {
		if (isNumber) {
			const num = parseFloat(code);
			if (isNaN(num)) newParts.push(code);
			else newParts.push(Math.ceil(num * ratio * precision) / precision);
		} else newParts.push(code);
		code = oldParts.shift();
		if (code === void 0) return newParts.join("");
		isNumber = !isNumber;
	}
}
function splitSVGDefs(content, tag = "defs") {
	let defs = "";
	const index = content.indexOf("<" + tag);
	while (index >= 0) {
		const start = content.indexOf(">", index);
		const end = content.indexOf("</" + tag);
		if (start === -1 || end === -1) break;
		const endEnd = content.indexOf(">", end);
		if (endEnd === -1) break;
		defs += content.slice(start + 1, end).trim();
		content = content.slice(0, index).trim() + content.slice(endEnd + 1);
	}
	return {
		defs,
		content
	};
}
/**
* Merge defs and content
*/
function mergeDefsAndContent(defs, content) {
	return defs ? "<defs>" + defs + "</defs>" + content : content;
}
/**
* Wrap SVG content, without wrapping definitions
*/
function wrapSVGContent(body, start, end) {
	const split = splitSVGDefs(body);
	return mergeDefsAndContent(split.defs, start + split.content + end);
}
/**
* Check if value should be unset. Allows multiple keywords
*/
var isUnsetKeyword = (value) => value === "unset" || value === "undefined" || value === "none";
/**
* Get SVG attributes and content from icon + customisations
*
* Does not generate style to make it compatible with frameworks that use objects for style, such as React.
* Instead, it generates 'inline' value. If true, rendering engine should add verticalAlign: -0.125em to icon.
*
* Customisations should be normalised by platform specific parser.
* Result should be converted to <svg> by platform specific parser.
* Use replaceIDs to generate unique IDs for body.
*/
function iconToSVG(icon, customisations) {
	const fullIcon = {
		...defaultIconProps,
		...icon
	};
	const fullCustomisations = {
		...defaultIconCustomisations,
		...customisations
	};
	const box = {
		left: fullIcon.left,
		top: fullIcon.top,
		width: fullIcon.width,
		height: fullIcon.height
	};
	let body = fullIcon.body;
	[fullIcon, fullCustomisations].forEach((props) => {
		const transformations = [];
		const hFlip = props.hFlip;
		const vFlip = props.vFlip;
		let rotation = props.rotate;
		if (hFlip) if (vFlip) rotation += 2;
		else {
			transformations.push("translate(" + (box.width + box.left).toString() + " " + (0 - box.top).toString() + ")");
			transformations.push("scale(-1 1)");
			box.top = box.left = 0;
		}
		else if (vFlip) {
			transformations.push("translate(" + (0 - box.left).toString() + " " + (box.height + box.top).toString() + ")");
			transformations.push("scale(1 -1)");
			box.top = box.left = 0;
		}
		let tempValue;
		if (rotation < 0) rotation -= Math.floor(rotation / 4) * 4;
		rotation = rotation % 4;
		switch (rotation) {
			case 1:
				tempValue = box.height / 2 + box.top;
				transformations.unshift("rotate(90 " + tempValue.toString() + " " + tempValue.toString() + ")");
				break;
			case 2:
				transformations.unshift("rotate(180 " + (box.width / 2 + box.left).toString() + " " + (box.height / 2 + box.top).toString() + ")");
				break;
			case 3:
				tempValue = box.width / 2 + box.left;
				transformations.unshift("rotate(-90 " + tempValue.toString() + " " + tempValue.toString() + ")");
				break;
		}
		if (rotation % 2 === 1) {
			if (box.left !== box.top) {
				tempValue = box.left;
				box.left = box.top;
				box.top = tempValue;
			}
			if (box.width !== box.height) {
				tempValue = box.width;
				box.width = box.height;
				box.height = tempValue;
			}
		}
		if (transformations.length) body = wrapSVGContent(body, "<g transform=\"" + transformations.join(" ") + "\">", "</g>");
	});
	const customisationsWidth = fullCustomisations.width;
	const customisationsHeight = fullCustomisations.height;
	const boxWidth = box.width;
	const boxHeight = box.height;
	let width;
	let height;
	if (customisationsWidth === null) {
		height = customisationsHeight === null ? "1em" : customisationsHeight === "auto" ? boxHeight : customisationsHeight;
		width = calculateSize(height, boxWidth / boxHeight);
	} else {
		width = customisationsWidth === "auto" ? boxWidth : customisationsWidth;
		height = customisationsHeight === null ? calculateSize(width, boxHeight / boxWidth) : customisationsHeight === "auto" ? boxHeight : customisationsHeight;
	}
	const attributes = {};
	const setAttr = (prop, value) => {
		if (!isUnsetKeyword(value)) attributes[prop] = value.toString();
	};
	setAttr("width", width);
	setAttr("height", height);
	const viewBox = [
		box.left,
		box.top,
		boxWidth,
		boxHeight
	];
	attributes.viewBox = viewBox.join(" ");
	return {
		attributes,
		viewBox,
		body
	};
}
/**
* Regular expression for finding ids
*/
var regex = /\sid="(\S+)"/g;
/**
* Counters
*/
var counters = /* @__PURE__ */ new Map();
/**
* Get unique new ID
*/
function nextID(id) {
	id = id.replace(/[0-9]+$/, "") || "a";
	const count = counters.get(id) || 0;
	counters.set(id, count + 1);
	return count ? `${id}${count}` : id;
}
/**
* Replace IDs in SVG output with unique IDs
*/
function replaceIDs(body) {
	const ids = [];
	let match;
	while (match = regex.exec(body)) ids.push(match[1]);
	if (!ids.length) return body;
	const suffix = "suffix" + (Math.random() * 16777216 | Date.now()).toString(16);
	ids.forEach((id) => {
		const newID = nextID(id);
		const escapedID = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		body = body.replace(new RegExp("([#;\"])(" + escapedID + ")([\")]|\\.[a-z])", "g"), "$1" + newID + suffix + "$3");
	});
	body = body.replace(new RegExp(suffix, "g"), "");
	return body;
}
/**
* Local storate types and entries
*/
var storage = Object.create(null);
/**
* Set API module
*/
function setAPIModule(provider, item) {
	storage[provider] = item;
}
/**
* Get API module
*/
function getAPIModule(provider) {
	return storage[provider] || storage[""];
}
/**
* Create full API configuration from partial data
*/
function createAPIConfig(source) {
	let resources;
	if (typeof source.resources === "string") resources = [source.resources];
	else {
		resources = source.resources;
		if (!(resources instanceof Array) || !resources.length) return null;
	}
	return {
		resources,
		path: source.path || "/",
		maxURL: source.maxURL || 500,
		rotate: source.rotate || 750,
		timeout: source.timeout || 5e3,
		random: source.random === true,
		index: source.index || 0,
		dataAfterTimeout: source.dataAfterTimeout !== false
	};
}
/**
* Local storage
*/
var configStorage = Object.create(null);
/**
* Redundancy for API servers.
*
* API should have very high uptime because of implemented redundancy at server level, but
* sometimes bad things happen. On internet 100% uptime is not possible.
*
* There could be routing problems. Server might go down for whatever reason, but it takes
* few minutes to detect that downtime, so during those few minutes API might not be accessible.
*
* This script has some redundancy to mitigate possible network issues.
*
* If one host cannot be reached in 'rotate' (750 by default) ms, script will try to retrieve
* data from different host. Hosts have different configurations, pointing to different
* API servers hosted at different providers.
*/
var fallBackAPISources = ["https://api.simplesvg.com", "https://api.unisvg.com"];
var fallBackAPI = [];
while (fallBackAPISources.length > 0) if (fallBackAPISources.length === 1) fallBackAPI.push(fallBackAPISources.shift());
else if (Math.random() > .5) fallBackAPI.push(fallBackAPISources.shift());
else fallBackAPI.push(fallBackAPISources.pop());
configStorage[""] = createAPIConfig({ resources: ["https://api.iconify.design"].concat(fallBackAPI) });
/**
* Add custom config for provider
*/
function addAPIProvider(provider, customConfig) {
	const config = createAPIConfig(customConfig);
	if (config === null) return false;
	configStorage[provider] = config;
	return true;
}
/**
* Get API configuration
*/
function getAPIConfig(provider) {
	return configStorage[provider];
}
var detectFetch = () => {
	let callback;
	try {
		callback = fetch;
		if (typeof callback === "function") return callback;
	} catch (err) {}
};
/**
* Fetch function
*/
var fetchModule = detectFetch();
/**
* Calculate maximum icons list length for prefix
*/
function calculateMaxLength(provider, prefix) {
	const config = getAPIConfig(provider);
	if (!config) return 0;
	let result;
	if (!config.maxURL) result = 0;
	else {
		let maxHostLength = 0;
		config.resources.forEach((item) => {
			maxHostLength = Math.max(maxHostLength, item.length);
		});
		const url = prefix + ".json?icons=";
		result = config.maxURL - maxHostLength - config.path.length - url.length;
	}
	return result;
}
/**
* Should query be aborted, based on last HTTP status
*/
function shouldAbort(status) {
	return status === 404;
}
/**
* Prepare params
*/
var prepare = (provider, prefix, icons) => {
	const results = [];
	const maxLength = calculateMaxLength(provider, prefix);
	const type = "icons";
	let item = {
		type,
		provider,
		prefix,
		icons: []
	};
	let length = 0;
	icons.forEach((name, index) => {
		length += name.length + 1;
		if (length >= maxLength && index > 0) {
			results.push(item);
			item = {
				type,
				provider,
				prefix,
				icons: []
			};
			length = name.length;
		}
		item.icons.push(name);
	});
	results.push(item);
	return results;
};
/**
* Get path
*/
function getPath(provider) {
	if (typeof provider === "string") {
		const config = getAPIConfig(provider);
		if (config) return config.path;
	}
	return "/";
}
/**
* Load icons
*/
var send = (host, params, callback) => {
	if (!fetchModule) {
		callback("abort", 424);
		return;
	}
	let path = getPath(params.provider);
	switch (params.type) {
		case "icons": {
			const prefix = params.prefix;
			const iconsList = params.icons.join(",");
			const urlParams = new URLSearchParams({ icons: iconsList });
			path += prefix + ".json?" + urlParams.toString();
			break;
		}
		case "custom": {
			const uri = params.uri;
			path += uri.slice(0, 1) === "/" ? uri.slice(1) : uri;
			break;
		}
		default:
			callback("abort", 400);
			return;
	}
	let defaultError = 503;
	fetchModule(host + path).then((response) => {
		const status = response.status;
		if (status !== 200) {
			setTimeout(() => {
				callback(shouldAbort(status) ? "abort" : "next", status);
			});
			return;
		}
		defaultError = 501;
		return response.json();
	}).then((data) => {
		if (typeof data !== "object" || data === null) {
			setTimeout(() => {
				if (data === 404) callback("abort", data);
				else callback("next", defaultError);
			});
			return;
		}
		setTimeout(() => {
			callback("success", data);
		});
	}).catch(() => {
		callback("next", defaultError);
	});
};
/**
* Export module
*/
var fetchAPIModule = {
	prepare,
	send
};
/**
* Remove callback
*/
function removeCallback(storages, id) {
	storages.forEach((storage) => {
		const items = storage.loaderCallbacks;
		if (items) storage.loaderCallbacks = items.filter((row) => row.id !== id);
	});
}
/**
* Update all callbacks for provider and prefix
*/
function updateCallbacks(storage) {
	if (!storage.pendingCallbacksFlag) {
		storage.pendingCallbacksFlag = true;
		setTimeout(() => {
			storage.pendingCallbacksFlag = false;
			const items = storage.loaderCallbacks ? storage.loaderCallbacks.slice(0) : [];
			if (!items.length) return;
			let hasPending = false;
			const provider = storage.provider;
			const prefix = storage.prefix;
			items.forEach((item) => {
				const icons = item.icons;
				const oldLength = icons.pending.length;
				icons.pending = icons.pending.filter((icon) => {
					if (icon.prefix !== prefix) return true;
					const name = icon.name;
					if (storage.icons[name]) icons.loaded.push({
						provider,
						prefix,
						name
					});
					else if (storage.missing.has(name)) icons.missing.push({
						provider,
						prefix,
						name
					});
					else {
						hasPending = true;
						return true;
					}
					return false;
				});
				if (icons.pending.length !== oldLength) {
					if (!hasPending) removeCallback([storage], item.id);
					item.callback(icons.loaded.slice(0), icons.missing.slice(0), icons.pending.slice(0), item.abort);
				}
			});
		});
	}
}
/**
* Unique id counter for callbacks
*/
var idCounter = 0;
/**
* Add callback
*/
function storeCallback(callback, icons, pendingSources) {
	const id = idCounter++;
	const abort = removeCallback.bind(null, pendingSources, id);
	if (!icons.pending.length) return abort;
	const item = {
		id,
		icons,
		callback,
		abort
	};
	pendingSources.forEach((storage) => {
		(storage.loaderCallbacks || (storage.loaderCallbacks = [])).push(item);
	});
	return abort;
}
/**
* Check if icons have been loaded
*/
function sortIcons(icons) {
	const result = {
		loaded: [],
		missing: [],
		pending: []
	};
	const storage = Object.create(null);
	icons.sort((a, b) => {
		if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
		if (a.prefix !== b.prefix) return a.prefix.localeCompare(b.prefix);
		return a.name.localeCompare(b.name);
	});
	let lastIcon = {
		provider: "",
		prefix: "",
		name: ""
	};
	icons.forEach((icon) => {
		if (lastIcon.name === icon.name && lastIcon.prefix === icon.prefix && lastIcon.provider === icon.provider) return;
		lastIcon = icon;
		const provider = icon.provider;
		const prefix = icon.prefix;
		const name = icon.name;
		const providerStorage = storage[provider] || (storage[provider] = Object.create(null));
		const localStorage = providerStorage[prefix] || (providerStorage[prefix] = getStorage(provider, prefix));
		let list;
		if (name in localStorage.icons) list = result.loaded;
		else if (prefix === "" || localStorage.missing.has(name)) list = result.missing;
		else list = result.pending;
		const item = {
			provider,
			prefix,
			name
		};
		list.push(item);
	});
	return result;
}
/**
* Convert icons list from string/icon mix to icons and validate them
*/
function listToIcons(list, validate = true, simpleNames = false) {
	const result = [];
	list.forEach((item) => {
		const icon = typeof item === "string" ? stringToIcon(item, validate, simpleNames) : item;
		if (icon) result.push(icon);
	});
	return result;
}
/**
* Default RedundancyConfig for API calls
*/
var defaultConfig = {
	resources: [],
	index: 0,
	timeout: 2e3,
	rotate: 750,
	random: false,
	dataAfterTimeout: false
};
/**
* Send query
*/
function sendQuery(config, payload, query, done) {
	const resourcesCount = config.resources.length;
	const startIndex = config.random ? Math.floor(Math.random() * resourcesCount) : config.index;
	let resources;
	if (config.random) {
		let list = config.resources.slice(0);
		resources = [];
		while (list.length > 1) {
			const nextIndex = Math.floor(Math.random() * list.length);
			resources.push(list[nextIndex]);
			list = list.slice(0, nextIndex).concat(list.slice(nextIndex + 1));
		}
		resources = resources.concat(list);
	} else resources = config.resources.slice(startIndex).concat(config.resources.slice(0, startIndex));
	const startTime = Date.now();
	let status = "pending";
	let queriesSent = 0;
	let lastError;
	let timer = null;
	let queue = [];
	let doneCallbacks = [];
	if (typeof done === "function") doneCallbacks.push(done);
	/**
	* Reset timer
	*/
	function resetTimer() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	}
	/**
	* Abort everything
	*/
	function abort() {
		if (status === "pending") status = "aborted";
		resetTimer();
		queue.forEach((item) => {
			if (item.status === "pending") item.status = "aborted";
		});
		queue = [];
	}
	/**
	* Add / replace callback to call when execution is complete.
	* This can be used to abort pending query implementations when query is complete or aborted.
	*/
	function subscribe(callback, overwrite) {
		if (overwrite) doneCallbacks = [];
		if (typeof callback === "function") doneCallbacks.push(callback);
	}
	/**
	* Get query status
	*/
	function getQueryStatus() {
		return {
			startTime,
			payload,
			status,
			queriesSent,
			queriesPending: queue.length,
			subscribe,
			abort
		};
	}
	/**
	* Fail query
	*/
	function failQuery() {
		status = "failed";
		doneCallbacks.forEach((callback) => {
			callback(void 0, lastError);
		});
	}
	/**
	* Clear queue
	*/
	function clearQueue() {
		queue.forEach((item) => {
			if (item.status === "pending") item.status = "aborted";
		});
		queue = [];
	}
	/**
	* Got response from module
	*/
	function moduleResponse(item, response, data) {
		const isError = response !== "success";
		queue = queue.filter((queued) => queued !== item);
		switch (status) {
			case "pending": break;
			case "failed":
				if (isError || !config.dataAfterTimeout) return;
				break;
			default: return;
		}
		if (response === "abort") {
			lastError = data;
			failQuery();
			return;
		}
		if (isError) {
			lastError = data;
			if (!queue.length) if (!resources.length) failQuery();
			else execNext();
			return;
		}
		resetTimer();
		clearQueue();
		if (!config.random) {
			const index = config.resources.indexOf(item.resource);
			if (index !== -1 && index !== config.index) config.index = index;
		}
		status = "completed";
		doneCallbacks.forEach((callback) => {
			callback(data);
		});
	}
	/**
	* Execute next query
	*/
	function execNext() {
		if (status !== "pending") return;
		resetTimer();
		const resource = resources.shift();
		if (resource === void 0) {
			if (queue.length) {
				timer = setTimeout(() => {
					resetTimer();
					if (status === "pending") {
						clearQueue();
						failQuery();
					}
				}, config.timeout);
				return;
			}
			failQuery();
			return;
		}
		const item = {
			status: "pending",
			resource,
			callback: (status$1, data) => {
				moduleResponse(item, status$1, data);
			}
		};
		queue.push(item);
		queriesSent++;
		timer = setTimeout(execNext, config.rotate);
		query(resource, payload, item.callback);
	}
	setTimeout(execNext);
	return getQueryStatus;
}
/**
* Redundancy instance
*/
function initRedundancy(cfg) {
	const config = {
		...defaultConfig,
		...cfg
	};
	let queries = [];
	/**
	* Remove aborted and completed queries
	*/
	function cleanup() {
		queries = queries.filter((item) => item().status === "pending");
	}
	/**
	* Send query
	*/
	function query(payload, queryCallback, doneCallback) {
		const query$1 = sendQuery(config, payload, queryCallback, (data, error) => {
			cleanup();
			if (doneCallback) doneCallback(data, error);
		});
		queries.push(query$1);
		return query$1;
	}
	/**
	* Find instance
	*/
	function find(callback) {
		return queries.find((value) => {
			return callback(value);
		}) || null;
	}
	return {
		query,
		find,
		setIndex: (index) => {
			config.index = index;
		},
		getIndex: () => config.index,
		cleanup
	};
}
function emptyCallback$1() {}
var redundancyCache = Object.create(null);
/**
* Get Redundancy instance for provider
*/
function getRedundancyCache(provider) {
	if (!redundancyCache[provider]) {
		const config = getAPIConfig(provider);
		if (!config) return;
		redundancyCache[provider] = {
			config,
			redundancy: initRedundancy(config)
		};
	}
	return redundancyCache[provider];
}
/**
* Send API query
*/
function sendAPIQuery(target, query, callback) {
	let redundancy;
	let send;
	if (typeof target === "string") {
		const api = getAPIModule(target);
		if (!api) {
			callback(void 0, 424);
			return emptyCallback$1;
		}
		send = api.send;
		const cached = getRedundancyCache(target);
		if (cached) redundancy = cached.redundancy;
	} else {
		const config = createAPIConfig(target);
		if (config) {
			redundancy = initRedundancy(config);
			const api = getAPIModule(target.resources ? target.resources[0] : "");
			if (api) send = api.send;
		}
	}
	if (!redundancy || !send) {
		callback(void 0, 424);
		return emptyCallback$1;
	}
	return redundancy.query(query, send, callback)().abort;
}
function emptyCallback() {}
/**
* Function called when new icons have been loaded
*/
function loadedNewIcons(storage) {
	if (!storage.iconsLoaderFlag) {
		storage.iconsLoaderFlag = true;
		setTimeout(() => {
			storage.iconsLoaderFlag = false;
			updateCallbacks(storage);
		});
	}
}
/**
* Check icon names for API
*/
function checkIconNamesForAPI(icons) {
	const valid = [];
	const invalid = [];
	icons.forEach((name) => {
		(name.match(matchIconName) ? valid : invalid).push(name);
	});
	return {
		valid,
		invalid
	};
}
/**
* Parse loader response
*/
function parseLoaderResponse(storage, icons, data) {
	function checkMissing() {
		const pending = storage.pendingIcons;
		icons.forEach((name) => {
			if (pending) pending.delete(name);
			if (!storage.icons[name]) storage.missing.add(name);
		});
	}
	if (data && typeof data === "object") try {
		if (!addIconSet(storage, data).length) {
			checkMissing();
			return;
		}
	} catch (err) {
		console.error(err);
	}
	checkMissing();
	loadedNewIcons(storage);
}
/**
* Handle response that can be async
*/
function parsePossiblyAsyncResponse(response, callback) {
	if (response instanceof Promise) response.then((data) => {
		callback(data);
	}).catch(() => {
		callback(null);
	});
	else callback(response);
}
/**
* Load icons
*/
function loadNewIcons(storage, icons) {
	if (!storage.iconsToLoad) storage.iconsToLoad = icons;
	else storage.iconsToLoad = storage.iconsToLoad.concat(icons).sort();
	if (!storage.iconsQueueFlag) {
		storage.iconsQueueFlag = true;
		setTimeout(() => {
			storage.iconsQueueFlag = false;
			const { provider, prefix } = storage;
			const icons$1 = storage.iconsToLoad;
			delete storage.iconsToLoad;
			if (!icons$1 || !icons$1.length) return;
			const customIconLoader = storage.loadIcon;
			if (storage.loadIcons && (icons$1.length > 1 || !customIconLoader)) {
				parsePossiblyAsyncResponse(storage.loadIcons(icons$1, prefix, provider), (data) => {
					parseLoaderResponse(storage, icons$1, data);
				});
				return;
			}
			if (customIconLoader) {
				icons$1.forEach((name) => {
					parsePossiblyAsyncResponse(customIconLoader(name, prefix, provider), (data) => {
						parseLoaderResponse(storage, [name], data ? {
							prefix,
							icons: { [name]: data }
						} : null);
					});
				});
				return;
			}
			const { valid, invalid } = checkIconNamesForAPI(icons$1);
			if (invalid.length) parseLoaderResponse(storage, invalid, null);
			if (!valid.length) return;
			const api = prefix.match(matchIconName) ? getAPIModule(provider) : null;
			if (!api) {
				parseLoaderResponse(storage, valid, null);
				return;
			}
			api.prepare(provider, prefix, valid).forEach((item) => {
				sendAPIQuery(provider, item, (data) => {
					parseLoaderResponse(storage, item.icons, data);
				});
			});
		});
	}
}
/**
* Load icons
*/
var loadIcons = (icons, callback) => {
	const sortedIcons = sortIcons(listToIcons(icons, true, allowSimpleNames()));
	if (!sortedIcons.pending.length) {
		let callCallback = true;
		if (callback) setTimeout(() => {
			if (callCallback) callback(sortedIcons.loaded, sortedIcons.missing, sortedIcons.pending, emptyCallback);
		});
		return () => {
			callCallback = false;
		};
	}
	const newIcons = Object.create(null);
	const sources = [];
	let lastProvider, lastPrefix;
	sortedIcons.pending.forEach((icon) => {
		const { provider, prefix } = icon;
		if (prefix === lastPrefix && provider === lastProvider) return;
		lastProvider = provider;
		lastPrefix = prefix;
		sources.push(getStorage(provider, prefix));
		const providerNewIcons = newIcons[provider] || (newIcons[provider] = Object.create(null));
		if (!providerNewIcons[prefix]) providerNewIcons[prefix] = [];
	});
	sortedIcons.pending.forEach((icon) => {
		const { provider, prefix, name } = icon;
		const storage = getStorage(provider, prefix);
		const pendingQueue = storage.pendingIcons || (storage.pendingIcons = /* @__PURE__ */ new Set());
		if (!pendingQueue.has(name)) {
			pendingQueue.add(name);
			newIcons[provider][prefix].push(name);
		}
	});
	sources.forEach((storage) => {
		const list = newIcons[storage.provider][storage.prefix];
		if (list.length) loadNewIcons(storage, list);
	});
	return callback ? storeCallback(callback, sortedIcons, sources) : emptyCallback;
};
/**
* Convert IconifyIconCustomisations to FullIconCustomisations, checking value types
*/
function mergeCustomisations(defaults, item) {
	const result = { ...defaults };
	for (const key in item) {
		const value = item[key];
		const valueType = typeof value;
		if (key in defaultIconSizeCustomisations) {
			if (value === null || value && (valueType === "string" || valueType === "number")) result[key] = value;
		} else if (valueType === typeof result[key]) result[key] = key === "rotate" ? value % 4 : value;
	}
	return result;
}
var separator = /[\s,]+/;
/**
* Apply "flip" string to icon customisations
*/
function flipFromString(custom, flip) {
	flip.split(separator).forEach((str) => {
		switch (str.trim()) {
			case "horizontal":
				custom.hFlip = true;
				break;
			case "vertical":
				custom.vFlip = true;
				break;
		}
	});
}
/**
* Get rotation value
*/
function rotateFromString(value, defaultValue = 0) {
	const units = value.replace(/^-?[0-9.]*/, "");
	function cleanup(value$1) {
		while (value$1 < 0) value$1 += 4;
		return value$1 % 4;
	}
	if (units === "") {
		const num = parseInt(value);
		return isNaN(num) ? 0 : cleanup(num);
	} else if (units !== value) {
		let split = 0;
		switch (units) {
			case "%":
				split = 25;
				break;
			case "deg": split = 90;
		}
		if (split) {
			let num = parseFloat(value.slice(0, value.length - units.length));
			if (isNaN(num)) return 0;
			num = num / split;
			return num % 1 === 0 ? cleanup(num) : 0;
		}
	}
	return defaultValue;
}
/**
* Generate <svg>
*/
function iconToHTML(body, attributes) {
	let renderAttribsHTML = body.indexOf("xlink:") === -1 ? "" : " xmlns:xlink=\"http://www.w3.org/1999/xlink\"";
	for (const attr in attributes) renderAttribsHTML += " " + attr + "=\"" + attributes[attr] + "\"";
	return "<svg xmlns=\"http://www.w3.org/2000/svg\"" + renderAttribsHTML + ">" + body + "</svg>";
}
/**
* Encode SVG for use in url()
*
* Short alternative to encodeURIComponent() that encodes only stuff used in SVG, generating
* smaller code.
*/
function encodeSVGforURL(svg) {
	return svg.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, " ");
}
/**
* Generate data: URL from SVG
*/
function svgToData(svg) {
	return "data:image/svg+xml," + encodeSVGforURL(svg);
}
/**
* Generate url() from SVG
*/
function svgToURL(svg) {
	return "url(\"" + svgToData(svg) + "\")";
}
var defaultExtendedIconCustomisations = {
	...defaultIconCustomisations,
	inline: false
};
/**
* Default SVG attributes
*/
var svgDefaults = {
	"xmlns": "http://www.w3.org/2000/svg",
	"xmlns:xlink": "http://www.w3.org/1999/xlink",
	"aria-hidden": true,
	"role": "img"
};
/**
* Style modes
*/
var commonProps = { display: "inline-block" };
var monotoneProps = { "background-color": "currentColor" };
var coloredProps = { "background-color": "transparent" };
var propsToAdd = {
	image: "var(--svg)",
	repeat: "no-repeat",
	size: "100% 100%"
};
var propsToAddTo = {
	"-webkit-mask": monotoneProps,
	"mask": monotoneProps,
	"background": coloredProps
};
for (const prefix in propsToAddTo) {
	const list = propsToAddTo[prefix];
	for (const prop in propsToAdd) list[prefix + "-" + prop] = propsToAdd[prop];
}
/**
* Fix size: add 'px' to numbers
*/
function fixSize(value) {
	return value + (value.match(/^[-0-9.]+$/) ? "px" : "");
}
/**
* Generate icon from properties
*/
function render(icon, props) {
	const customisations = mergeCustomisations(defaultExtendedIconCustomisations, props);
	const mode = props.mode || "svg";
	const componentProps = mode === "svg" ? { ...svgDefaults } : {};
	if (icon.body.indexOf("xlink:") === -1) delete componentProps["xmlns:xlink"];
	let style = typeof props.style === "string" ? props.style : "";
	for (let key in props) {
		const value = props[key];
		if (value === void 0) continue;
		switch (key) {
			case "icon":
			case "style":
			case "onLoad":
			case "mode":
			case "ssr": break;
			case "inline":
			case "hFlip":
			case "vFlip":
				customisations[key] = value === true || value === "true" || value === 1;
				break;
			case "flip":
				if (typeof value === "string") flipFromString(customisations, value);
				break;
			case "color":
				style = style + (style.length > 0 && style.trim().slice(-1) !== ";" ? ";" : "") + "color: " + value + "; ";
				break;
			case "rotate":
				if (typeof value === "string") customisations[key] = rotateFromString(value);
				else if (typeof value === "number") customisations[key] = value;
				break;
			case "ariaHidden":
			case "aria-hidden":
				if (value !== true && value !== "true") delete componentProps["aria-hidden"];
				break;
			default:
				if (key.slice(0, 3) === "on:") break;
				if (defaultExtendedIconCustomisations[key] === void 0) componentProps[key] = value;
		}
	}
	const item = iconToSVG(icon, customisations);
	const renderAttribs = item.attributes;
	if (customisations.inline) style = "vertical-align: -0.125em; " + style;
	if (mode === "svg") {
		Object.assign(componentProps, renderAttribs);
		if (style !== "") componentProps.style = style;
		return {
			svg: true,
			attributes: componentProps,
			body: replaceIDs(item.body)
		};
	}
	const { body, width, height } = icon;
	const useMask = mode === "mask" || (mode === "bg" ? false : body.indexOf("currentColor") !== -1);
	const url = svgToURL(iconToHTML(body, {
		...renderAttribs,
		width: width + "",
		height: height + ""
	}));
	const styles = { "--svg": url };
	const size = (prop) => {
		const value = renderAttribs[prop];
		if (value) styles[prop] = fixSize(value);
	};
	size("width");
	size("height");
	Object.assign(styles, commonProps, useMask ? monotoneProps : coloredProps);
	let customStyle = "";
	for (const key in styles) customStyle += key + ": " + styles[key] + ";";
	componentProps.style = customStyle + style;
	return {
		svg: false,
		attributes: componentProps
	};
}
/**
* Initialise stuff
*/
allowSimpleNames(true);
setAPIModule("", fetchAPIModule);
/**
* Browser stuff
*/
if (typeof document !== "undefined" && typeof window !== "undefined") {
	const _window = window;
	if (_window.IconifyPreload !== void 0) {
		const preload = _window.IconifyPreload;
		const err = "Invalid IconifyPreload syntax.";
		if (typeof preload === "object" && preload !== null) (preload instanceof Array ? preload : [preload]).forEach((item) => {
			try {
				if (typeof item !== "object" || item === null || item instanceof Array || typeof item.icons !== "object" || typeof item.prefix !== "string" || !addCollection(item)) console.error(err);
			} catch (e) {
				console.error(err);
			}
		});
	}
	if (_window.IconifyProviders !== void 0) {
		const providers = _window.IconifyProviders;
		if (typeof providers === "object" && providers !== null) for (let key in providers) {
			const err = "IconifyProviders[" + key + "] is invalid.";
			try {
				const value = providers[key];
				if (typeof value !== "object" || !value || value.resources === void 0) continue;
				if (!addAPIProvider(key, value)) console.error(err);
			} catch (e) {
				console.error(err);
			}
		}
	}
}
/**
* Check for SSR
*/
function isSSR() {
	try {
		return typeof window !== "object";
	} catch (err) {
		return true;
	}
}
/**
* Check if component needs to be updated
*/
function checkIconState(icon, state, callback, onload) {
	function abortLoading() {
		if (state.loading) {
			state.loading.abort();
			state.loading = null;
		}
	}
	if (typeof icon === "object" && icon !== null && typeof icon.body === "string") {
		state.name = "";
		abortLoading();
		return { data: {
			...defaultIconProps,
			...icon
		} };
	}
	let iconName;
	if (typeof icon !== "string" || (iconName = stringToIcon(icon, false, true)) === null) {
		abortLoading();
		return null;
	}
	const data = getIconData(iconName);
	if (!data) {
		if (!isSSR() && (!state.loading || state.loading.name !== icon)) {
			abortLoading();
			state.name = "";
			state.loading = {
				name: icon,
				abort: loadIcons([iconName], callback)
			};
		}
		return null;
	}
	abortLoading();
	if (state.name !== icon) {
		state.name = icon;
		if (onload && !state.destroyed) setTimeout(() => {
			onload(icon);
		});
	}
	const classes = ["iconify"];
	if (iconName.prefix !== "") classes.push("iconify--" + iconName.prefix);
	if (iconName.provider !== "") classes.push("iconify--" + iconName.provider);
	return {
		data,
		classes
	};
}
/**
* Generate icon
*/
function generateIcon(icon, props) {
	return icon ? render({
		...defaultIconProps,
		...icon
	}, props) : null;
}
//#endregion
//#region node_modules/@iconify/svelte/dist/Icon.svelte
function Icon($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const iconState = {
			name: "",
			loading: null,
			destroyed: false
		};
		const { $$slots, $$events, ...props } = $$props;
		let iconData = derived(() => {
			return checkIconState(props.icon, iconState, loaded, props.onload);
		});
		let data = derived(() => {
			const generatedData = iconData() ? generateIcon(iconData().data, props) : null;
			if (generatedData && iconData().classes && props["class"] === void 0) generatedData.attributes["class"] = (typeof props["class"] === "string" ? props["class"] + " " : "") + iconData().classes.join(" ");
			return generatedData;
		});
		function loaded() {
		}
		onDestroy(() => {
			iconState.destroyed = true;
			if (iconState.loading) {
				iconState.loading.abort();
				iconState.loading = null;
			}
		});
		if (data()) {
			$$renderer.push("<!--[-->");
			if (data().svg) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<svg${attributes({ ...data().attributes }, void 0, void 0, void 0, 3)}>${html(data().body)}</svg>`);
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push(`<span${attributes({ ...data().attributes })}></span>`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/lib/utils/helpers.ts
function createAbortError() {
	try {
		return new DOMException("Operation aborted.", "AbortError");
	} catch {
		return /* @__PURE__ */ new Error("Operation aborted.");
	}
}
function scheduleAfter(delayMs, callback) {
	if (typeof requestAnimationFrame !== "function") {
		callback();
		return () => {};
	}
	let frameId = 0;
	let startTs = null;
	let cancelled = false;
	const tick = (timestamp) => {
		if (cancelled) return;
		if (startTs === null) startTs = timestamp;
		if (timestamp - startTs >= delayMs) {
			callback();
			return;
		}
		frameId = requestAnimationFrame(tick);
	};
	frameId = requestAnimationFrame(tick);
	return () => {
		cancelled = true;
		cancelAnimationFrame(frameId);
	};
}
function waitForDelay(delayMs, signal) {
	if (signal?.aborted) return Promise.reject(createAbortError());
	return new Promise((resolve, reject) => {
		let cancel = () => {};
		const handleAbort = () => {
			cancel();
			reject(createAbortError());
		};
		cancel = scheduleAfter(delayMs, () => {
			signal?.removeEventListener("abort", handleAbort);
			resolve();
		});
		signal?.addEventListener("abort", handleAbort, { once: true });
	});
}
//#endregion
//#region src/lib/components/kefine/KefineTopbar.svelte
function KefineTopbar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { brandLabel, navigationLabel, openSidebarLabel, collapseSidebarLabel, dockLabel, socialLabel, legalLabel, mailLabel, githubLabel, githubUrl, themeLabel, signInLabel, signedInLabel, authenticatedLabel, authenticatedSecondaryLabel, authenticatedAvatarUrl, isAuthenticated, isDarkTheme, isExpanded, locale, languageEnglishLabel, languageRussianLabel, languageArmenianLabel, socialLinks, legalLinks, onToggleExpand, onBrandClick, onOpenEmailDraft, onOpenEmailDialog, onTheme, onAuth, onLocale } = $$props;
		const themeIcon = derived(() => isDarkTheme ? "mdi:white-balance-sunny" : "mdi:weather-night");
		const localeCycle = [
			"en",
			"ru",
			"hy"
		];
		const localeLabels = derived(() => ({
			en: languageEnglishLabel,
			ru: languageRussianLabel,
			hy: languageArmenianLabel
		}));
		const nextLocale = derived(() => localeCycle[(localeCycle.indexOf(locale) + 1) % localeCycle.length] ?? "en");
		const localeLabel = derived(() => localeLabels()[nextLocale()]);
		$$renderer.push(`<aside${attr_class("kefine-sidebar", void 0, { "kefine-sidebar--expanded": isExpanded })}${attr("aria-label", navigationLabel)}><button type="button" class="kefine-sidebar-brand"${attr("aria-label", isExpanded ? collapseSidebarLabel : openSidebarLabel)}${attr("title", brandLabel)}><kefine-sidebar-brand-mark class="kefine-sidebar-brand-mark">${escape_html(brandLabel)}</kefine-sidebar-brand-mark></button> `);
		if (isExpanded) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<kefine-sidebar-float class="kefine-sidebar-float"><section class="kefine-sidebar-stack"${attr("aria-label", dockLabel)}><section class="kefine-sidebar-toolbar kefine-sidebar-toolbar--social"${attr("aria-label", socialLabel)}><!--[-->`);
			const each_array = ensure_array_like(socialLinks);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let social = each_array[$$index];
				$$renderer.push(`<a class="kefine-sidebar-icon"${attr("href", social.href)} target="_blank" rel="noreferrer"${attr("aria-label", social.label)}${attr("title", social.label)}>`);
				Icon($$renderer, {
					icon: social.icon,
					width: "20",
					height: "20",
					"aria-hidden": "true"
				});
				$$renderer.push(`<!----></a>`);
			}
			$$renderer.push(`<!--]--></section> <nav class="kefine-sidebar-nav"${attr("aria-label", legalLabel)}><!--[-->`);
			const each_array_1 = ensure_array_like(legalLinks);
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let link = each_array_1[$$index_1];
				$$renderer.push(`<a class="kefine-sidebar-link"${attr("href", link.href)}><span class="kefine-sidebar-link-label">${escape_html(link.label)}</span></a>`);
			}
			$$renderer.push(`<!--]--></nav> <section class="kefine-sidebar-toolbar"${attr("aria-label", dockLabel)}><button type="button" class="kefine-sidebar-icon"${attr("aria-label", themeLabel)}${attr("title", themeLabel)}>`);
			Icon($$renderer, {
				icon: themeIcon(),
				width: "20",
				height: "20",
				"aria-hidden": "true"
			});
			$$renderer.push(`<!----></button> <button type="button" class="kefine-sidebar-icon"${attr("aria-label", localeLabel())}${attr("title", localeLabel())}>`);
			Icon($$renderer, {
				icon: "mdi:translate",
				width: "20",
				height: "20",
				"aria-hidden": "true"
			});
			$$renderer.push(`<!----></button> <button type="button" class="kefine-sidebar-icon"${attr("aria-label", mailLabel)}${attr("title", mailLabel)}>`);
			Icon($$renderer, {
				icon: "mdi:email-outline",
				width: "20",
				height: "20",
				"aria-hidden": "true"
			});
			$$renderer.push(`<!----></button> <a class="kefine-sidebar-icon"${attr("href", githubUrl)} target="_blank" rel="noreferrer"${attr("aria-label", githubLabel)}${attr("title", githubLabel)}>`);
			Icon($$renderer, {
				icon: "mdi:github",
				width: "20",
				height: "20",
				"aria-hidden": "true"
			});
			$$renderer.push(`<!----></a></section></section></kefine-sidebar-float>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></aside> <button type="button" class="kefine-sidebar-auth"${attr("data-variant", isAuthenticated ? "ghost" : "primary")}>`);
		if (isAuthenticated) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<span class="kefine-sidebar-auth__content">`);
			if (authenticatedAvatarUrl) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<img class="kefine-sidebar-auth__avatar"${attr("src", authenticatedAvatarUrl)} alt="" aria-hidden="true"/>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--> <span class="kefine-sidebar-auth__copy"><strong>${escape_html(authenticatedLabel ?? signedInLabel)}</strong> `);
			if (authenticatedSecondaryLabel) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<small>${escape_html(authenticatedSecondaryLabel)}</small>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--></span></span>`);
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push(`${escape_html(signInLabel)}`);
		}
		$$renderer.push(`<!--]--></button>`);
	});
}
//#endregion
//#region src/lib/components/kefine/kefine-order-formatters.ts
function formatKefineOrderStatus(status) {
	const normalized = status.trim().toLowerCase();
	if (normalized === "done" || normalized === "completed") return "Completed";
	if (normalized === "rejected") return "Rejected";
	if (normalized === "stopped" || normalized === "cancelled" || normalized === "canceled") return "Stopped";
	if (normalized === "executing" || normalized === "accepted") return "Executing";
	if (normalized === "queued") return "Queued";
	if (!normalized) return "Queued";
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
function formatKefineOrderPrice(order, priceLabel) {
	if (order.estimatedCost === void 0) return `${priceLabel} -`;
	return `${priceLabel} ${Number.isInteger(order.estimatedCost) ? String(order.estimatedCost) : order.estimatedCost.toFixed(2).replace(/\.?0+$/, "")} ${order.currency}`;
}
function formatKefineOrderTime(order, timeLeftLabel) {
	return order.executionEstimate ? `${timeLeftLabel} ${order.executionEstimate}` : `${timeLeftLabel} -`;
}
//#endregion
//#region src/lib/components/kefine/KefineOrderListItem.svelte
function KefineOrderListItem($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { order, statusLabel, timeLeftLabel, priceLabel, stopTaskLabel = "", itemTestId, openTestId, etaTestId, stopTestId, showStop = false, onOpen, onOpenKeydown, onStop, onStopPointerDown, onStopPointerUp, onStopPointerLeave, onStopPointerCancel } = $$props;
		$$renderer.push(`<li><kefine-order-item${attr("data-testid", itemTestId)}${attr("data-order-id", order.id)}${attr("data-status", order.status)} role="button" tabindex="0" class="svelte-1pxfazs">`);
		if (showStop) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<button type="button" data-part="status-toggle"${attr("data-testid", stopTestId)}${attr("aria-label", `${stopTaskLabel}: ${order.title}`)}${attr("data-status", order.status)} class="svelte-1pxfazs"><status-mark aria-hidden="true"${attr("data-status", order.status)}><task-dot class="svelte-1pxfazs"></task-dot></status-mark></button>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> <section data-part="open"${attr("data-testid", openTestId)} class="svelte-1pxfazs"><kefine-order-summary class="svelte-1pxfazs"><kefine-order-title class="svelte-1pxfazs">${escape_html(order.title)}</kefine-order-title> <kefine-order-meta class="svelte-1pxfazs"><kefine-order-solver class="svelte-1pxfazs">${escape_html(order.solver)}</kefine-order-solver> <kefine-order-estimate${attr("data-testid", etaTestId)} class="svelte-1pxfazs"><span>${escape_html(statusLabel)} ${escape_html(formatKefineOrderStatus(order.status))}</span> <span>${escape_html(formatKefineOrderTime(order, timeLeftLabel))}</span> <span>${escape_html(formatKefineOrderPrice(order, priceLabel))}</span></kefine-order-estimate></kefine-order-meta></kefine-order-summary></section></kefine-order-item></li>`);
	});
}
//#endregion
//#region src/lib/components/kefine/KefineCreateStep.svelte
function KefineCreateStep($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { draft, titleFontSize, title, subtitle, afe, placeholder, placeholderVariants, executeAria, backgroundExecuteAria, solverLabel, recentOrders, matchedOrders, isSearching, totalOrders, hasMoreOrders, matchedTasksLabel, addFileLabel, addPriceLabel, fileCountLabel, composerHints, timeLeftLabel, priceLabel, statusLabel, stopTaskLabel, onSubmit, onQueueTask, onAttachFiles, onRemoveFile, onStopOrder, onOpenOrder, onLoadMoreOrders } = $$props;
		let animatedPlaceholder = "";
		let placeholderVisible = false;
		let touchStopTimers = /* @__PURE__ */ new Map();
		let touchStopTriggered = /* @__PURE__ */ new Set();
		const isMultilineDraft = derived(() => draft.description.includes("\n"));
		const afeIntroCard = derived(() => afe.cards[0] ?? null);
		const afeStepCards = derived(() => afe.cards.slice(1));
		function startStopPress(order, event) {
			if (event.pointerType === "mouse") return;
			clearStopPress(order.id);
			event.preventDefault();
			event.stopPropagation();
			const cancelTimer = scheduleAfter(550, () => {
				touchStopTriggered = new Set([...touchStopTriggered, order.id]);
				onStopOrder(order, event);
				clearStopPress(order.id);
			});
			touchStopTimers = new Map(touchStopTimers).set(order.id, cancelTimer);
		}
		function clearStopPress(orderId) {
			const cancelTimer = touchStopTimers.get(orderId);
			if (cancelTimer) {
				cancelTimer();
				const nextTimers = new Map(touchStopTimers);
				nextTimers.delete(orderId);
				touchStopTimers = nextTimers;
			}
		}
		function handleStopClick(order, event) {
			if (touchStopTriggered.has(order.id)) {
				const nextTriggered = new Set(touchStopTriggered);
				nextTriggered.delete(order.id);
				touchStopTriggered = nextTriggered;
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			onStopOrder(order, event);
		}
		function handleOpenOrderKeydown(order, event) {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			onOpenOrder(order);
		}
		$$renderer.push(`<article class="kefine-card kefine-card--wide svelte-1pwznt3" data-kefine-create=""><h2 class="svelte-1pwznt3">${escape_html(title)}</h2> <p data-part="subtitle" class="svelte-1pwznt3">${escape_html(subtitle)}</p> <form data-part="form" class="svelte-1pwznt3"><fieldset data-part="exec-row" data-testid="kefine-create-form" class="svelte-1pwznt3"><kefine-task-shell class="svelte-1pwznt3"><textarea id="order-title" data-part="task-input"${attr("data-empty", !draft.description.trim())}${attr("data-multiline", isMultilineDraft())} data-testid="kefine-task-input"${attr_style(`--kef-task-font-size: ${titleFontSize}rem;`)} placeholder="" rows="1"${attr("wrap", isMultilineDraft() ? "soft" : "off")} class="svelte-1pwznt3">`);
		const $$body = escape_html(draft.description);
		if ($$body) $$renderer.push(`${$$body}`);
		$$renderer.push(`</textarea> `);
		if (!draft.description.trim()) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<kefine-task-placeholder${attr("data-visible", placeholderVisible)}${attr_style(`--kef-task-font-size: ${titleFontSize}rem;`)} aria-hidden="true" class="svelte-1pwznt3">${escape_html(animatedPlaceholder)}</kefine-task-placeholder>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></kefine-task-shell> <button type="submit" data-variant="primary" data-part="exec-button" data-testid="kefine-submit-task"${attr("aria-label", executeAria)} class="svelte-1pwznt3"><kefine-exec-arrow aria-hidden="true" class="svelte-1pwznt3">➵</kefine-exec-arrow></button></fieldset> <kefine-composer-strip${attr("aria-label", composerHints)} class="svelte-1pwznt3"><button type="button" data-part="composer-chip"${attr("title", backgroundExecuteAria)} class="svelte-1pwznt3"><span>${escape_html(addFileLabel)}</span> `);
		if (draft.files.length > 0) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<strong>${escape_html(fileCountLabel(draft.files.length))}</strong>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></button> `);
		$$renderer.push("<!--[!-->");
		$$renderer.push(`<button type="button" data-part="composer-chip" class="svelte-1pwznt3"><span>${escape_html(addPriceLabel)}</span></button>`);
		$$renderer.push(`<!--]--> <input data-part="file-input" type="file" multiple="" class="svelte-1pwznt3"/></kefine-composer-strip> `);
		if (draft.files.length > 0) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<kefine-file-list class="svelte-1pwznt3"><!--[-->`);
			const each_array = ensure_array_like(draft.files);
			for (let index = 0, $$length = each_array.length; index < $$length; index++) {
				let file = each_array[index];
				$$renderer.push(`<button type="button" data-part="file-pill" class="svelte-1pwznt3"><span>${escape_html(file.name)}</span> <strong>${escape_html(Math.max(1, Math.round(file.size / 1024)))} KB</strong></button>`);
			}
			$$renderer.push(`<!--]--></kefine-file-list>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> <p data-part="composer-hints" class="svelte-1pwznt3">${escape_html(composerHints)}</p></form> `);
		if (isSearching && matchedOrders.length > 0 || totalOrders > 0) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<section data-part="recent"${attr("aria-label", isSearching ? matchedTasksLabel : solverLabel)} class="svelte-1pwznt3">`);
			if (isSearching && matchedOrders.length > 0) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<kefine-recent-title class="svelte-1pwznt3">${escape_html(matchedTasksLabel)}</kefine-recent-title> <ul data-part="recent-list" data-compact="true" data-testid="kefine-search-results" class="svelte-1pwznt3"><!--[-->`);
				const each_array_1 = ensure_array_like(matchedOrders);
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let order = each_array_1[$$index_1];
					KefineOrderListItem($$renderer, {
						order,
						statusLabel,
						timeLeftLabel,
						priceLabel,
						itemTestId: `kefine-search-order-${order.id}`,
						openTestId: `kefine-open-search-order-${order.id}`,
						etaTestId: `kefine-order-eta-${order.id}`,
						onOpen: () => onOpenOrder(order),
						onOpenKeydown: (event) => handleOpenOrderKeydown(order, event)
					});
				}
				$$renderer.push(`<!--]--></ul>`);
			} else if (totalOrders > 0) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`<section data-part="recent-scroll" data-testid="kefine-recent-scroll" class="svelte-1pwznt3"><ul data-part="recent-list" data-testid="kefine-recent-list" class="svelte-1pwznt3"><!--[-->`);
				const each_array_2 = ensure_array_like(recentOrders);
				for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
					let order = each_array_2[$$index_2];
					KefineOrderListItem($$renderer, {
						order,
						statusLabel,
						timeLeftLabel,
						priceLabel,
						stopTaskLabel,
						showStop: true,
						itemTestId: `kefine-order-item-${order.id}`,
						openTestId: `kefine-open-order-${order.id}`,
						etaTestId: `kefine-order-eta-${order.id}`,
						stopTestId: `kefine-stop-order-${order.id}`,
						onOpen: () => onOpenOrder(order),
						onOpenKeydown: (event) => handleOpenOrderKeydown(order, event),
						onStop: (event) => handleStopClick(order, event),
						onStopPointerDown: (event) => startStopPress(order, event),
						onStopPointerUp: () => clearStopPress(order.id),
						onStopPointerLeave: () => clearStopPress(order.id),
						onStopPointerCancel: () => clearStopPress(order.id)
					});
				}
				$$renderer.push(`<!--]--></ul></section>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--></section>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></article> <section class="kefine-afe-showcase svelte-1pwznt3" data-part="below-fold"><div class="kefine-afe-layout">`);
		if (afeIntroCard()) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<article class="kefine-afe-intro"><p class="kefine-afe-intro__eyebrow">${escape_html(afeIntroCard().title)}</p> <h3>${escape_html(afeIntroCard().detail)}</h3></article>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> <div class="kefine-afe-steps"><div class="kefine-section-head"><p>${escape_html(afe.title)}</p></div> <div class="kefine-afe-grid kefine-afe-grid--executing"><!--[-->`);
		const each_array_3 = ensure_array_like(afeStepCards());
		for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
			let card = each_array_3[$$index_3];
			$$renderer.push(`<article class="kefine-afe-card kefine-afe-card--executing"><strong>${escape_html(card.title)}</strong> <p>${escape_html(card.detail)}</p></article>`);
		}
		$$renderer.push(`<!--]--></div></div></div></section>`);
	});
}
//#endregion
//#region src/lib/components/kefine/KefineModal.svelte
function KefineModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open, onClose, closeLabel = "Close", showClose = true, width = "min(34rem, calc(100vw - 2rem))", children } = $$props;
		$$renderer.push(`<dialog class="kefine-modal-shell svelte-1vlnlxe"${attr_style(`--kefine-modal-width: ${width};`)}>`);
		if (showClose) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<button type="button" class="kefine-modal-shell__close svelte-1vlnlxe" data-variant="close"${attr("aria-label", closeLabel)}>✕</button>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> <div class="kefine-modal-shell__body svelte-1vlnlxe">`);
		children?.($$renderer);
		$$renderer.push(`<!----></div></dialog>`);
	});
}
//#endregion
//#region src/lib/components/kefine/kefine-auth-constants.ts
var KEFINE_WALLET_PROVIDERS = [
	{
		icon: "logos:metamask-icon",
		label: "MetaMask",
		className: "is-metamask"
	},
	{
		icon: "simple-icons:walletconnect",
		label: "WalletConnect",
		className: "is-walletconnect"
	},
	{
		icon: "material-symbols:alternate-email-rounded",
		label: "Email",
		className: "is-email"
	},
	{
		icon: "logos:google-icon",
		label: "Google",
		className: "is-google"
	}
];
var KEFINE_AUTH_ICONS = {
	passkey: "mdi:fingerprint"};
//#endregion
//#region src/lib/components/kefine/KefineWalletProviderGrid.svelte
function KefineWalletProviderGrid($$renderer) {
	$$renderer.push(`<div class="kefine-wallet-grid"><!--[-->`);
	const each_array = ensure_array_like(KEFINE_WALLET_PROVIDERS);
	for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
		let provider = each_array[$$index];
		$$renderer.push(`<span${attr_class(clsx$1(provider.className))}${attr("aria-label", provider.label)}><span class="kefine-wallet-icon">`);
		Icon($$renderer, {
			icon: provider.icon,
			width: "100%",
			height: "100%",
			"aria-hidden": "true"
		});
		$$renderer.push(`<!----></span> <small>${escape_html(provider.label)}</small></span>`);
	}
	$$renderer.push(`<!--]--></div>`);
}
//#endregion
//#region src/lib/components/kefine/KefineAuthDialog.svelte
function KefineAuthDialog($$renderer, $$props) {
	let { open, title, description, walletTitle, passkeyTitle, closeLabel, onClose} = $$props;
	KefineModal($$renderer, {
		open,
		onClose,
		closeLabel,
		children: ($$renderer) => {
			$$renderer.push(`<header class="kefine-auth-dialog__header svelte-134pm0f"><div><h2 class="svelte-134pm0f">${escape_html(title)}</h2> <p class="svelte-134pm0f">${escape_html(description)}</p></div></header> <section class="kefine-auth-dialog__actions svelte-134pm0f"><button type="button" class="kefine-auth-tile kefine-auth-tile--wallet svelte-134pm0f"><div class="kefine-auth-hero kefine-auth-hero--wallet svelte-134pm0f" aria-hidden="true">`);
			KefineWalletProviderGrid($$renderer);
			$$renderer.push(`<!----></div> <strong>${escape_html(walletTitle)}</strong></button> <button type="button" class="kefine-auth-tile kefine-auth-tile--passkey svelte-134pm0f"><div class="kefine-auth-hero kefine-auth-hero--passkey svelte-134pm0f" aria-hidden="true"><span class="kefine-auth-icon svelte-134pm0f">`);
			Icon($$renderer, {
				icon: "mdi:fingerprint",
				width: "100%",
				height: "100%",
				"aria-hidden": "true"
			});
			$$renderer.push(`<!----></span></div> <strong>${escape_html(passkeyTitle)}</strong></button> `);
			$$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--></section>`);
		}});
}
//#endregion
//#region src/lib/components/kefine/KefineContactDialog.svelte
function KefineContactDialog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open, title, description, nameLabel, emailLabel, messageLabel, nameValue, emailValue, messageValue, namePlaceholder, emailPlaceholder, messagePlaceholder, submitLabel, closeLabel, onClose} = $$props;
		KefineModal($$renderer, {
			open,
			onClose,
			closeLabel,
			width: "min(30rem, calc(100vw - 2rem))",
			children: ($$renderer) => {
				$$renderer.push(`<header class="kefine-contact-dialog__header svelte-p0uxw5"><div><h2 class="svelte-p0uxw5">${escape_html(title)}</h2> <p class="svelte-p0uxw5">${escape_html(description)}</p></div></header> <form class="kefine-contact-dialog__form svelte-p0uxw5"><label class="kefine-contact-dialog__field svelte-p0uxw5"><span class="svelte-p0uxw5">${escape_html(nameLabel)}</span> <input type="text"${attr("value", nameValue)}${attr("placeholder", namePlaceholder)}/></label> <label class="kefine-contact-dialog__field svelte-p0uxw5"><span class="svelte-p0uxw5">${escape_html(emailLabel)}</span> <input type="email"${attr("value", emailValue)}${attr("placeholder", emailPlaceholder)}/></label> <label class="kefine-contact-dialog__field svelte-p0uxw5"><span class="svelte-p0uxw5">${escape_html(messageLabel)}</span> <textarea rows="5"${attr("placeholder", messagePlaceholder)}>`);
				const $$body = escape_html(messageValue);
				if ($$body) $$renderer.push(`${$$body}`);
				$$renderer.push(`</textarea></label> <footer class="kefine-contact-dialog__footer svelte-p0uxw5"><button type="button" data-variant="ghost">${escape_html(closeLabel)}</button> <button type="submit" data-variant="primary">${escape_html(submitLabel)}</button></footer></form>`);
			}});
	});
}
//#endregion
//#region src/lib/components/passkeys/PasskeyLogin.svelte
function PasskeyLogin($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { title = "Passkey", description = "Enter your handle once and continue with an existing passkey or create a new one."} = $$props;
		let status = "idle";
		let username = "";
		const existingSession = derived(() => get(passkeySessionStore));
		const hasExistingPasskey = derived(() => Boolean(existingSession()));
		$$renderer.push(`<section class="passkey-login svelte-kfppxf"><header class="passkey-login__header svelte-kfppxf"><h2 class="svelte-kfppxf">${escape_html(title)}</h2> <p class="svelte-kfppxf">${escape_html(description)}</p></header> <label class="passkey-login__field svelte-kfppxf"><span class="svelte-kfppxf">Handle or username</span> <input type="text"${attr("value", username)} autocomplete="username webauthn" autocapitalize="off" spellcheck="false" placeholder="discord-handle" class="svelte-kfppxf"/></label> <div class="passkey-login__actions svelte-kfppxf"><button type="button" class="passkey-login__primary svelte-kfppxf"${attr("disabled", status === "loading", true)}${attr("aria-busy", status === "loading")}>${escape_html(hasExistingPasskey() ? "Use existing passkey" : "Sign in with passkey")}</button> <button type="button" class="passkey-login__secondary svelte-kfppxf"${attr("disabled", status === "loading", true)}>${escape_html("Create passkey")}</button></div> `);
		if (hasExistingPasskey() && existingSession()) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<p class="passkey-login__hint svelte-kfppxf">Saved locally for @${escape_html(existingSession().username)}</p>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
//#region src/lib/components/kefine/KefinePasskeyDialog.svelte
function KefinePasskeyDialog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { open, title, onClose} = $$props;
		KefineModal($$renderer, {
			open,
			onClose,
			showClose: false,
			width: "min(32rem, calc(100vw - 2rem))",
			children: ($$renderer) => {
				PasskeyLogin($$renderer, {
					title,
					description: "Enter your handle once. If a passkey already exists, sign in. If the server is unavailable, a local passkey profile will be saved."});
			}});
	});
}
//#endregion
//#region src/lib/components/kefine/KefineSubmittingStep.svelte
function KefineSubmittingStep($$renderer) {
	$$renderer.push(`<article class="kefine-card kefine-card--wide"><ul class="kefine-progress" aria-hidden="true"><li></li> <li></li> <li></li></ul></article>`);
}
//#endregion
//#region src/lib/components/kefine/KefineVpnGuide.svelte
function KefineVpnGuide($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { guide } = $$props;
		$$renderer.push(`<div class="kefine-vpn-guide__steps"><!--[-->`);
		const each_array = ensure_array_like(guide.steps);
		for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
			let step = each_array[$$index_2];
			$$renderer.push(`<article class="kefine-vpn-guide__card"${attr("data-step", step.id)}><h3>${escape_html(step.title)}</h3> <p>${escape_html(step.summary)}</p> `);
			if (step.apps) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<div class="kefine-vpn-guide__apps"><!--[-->`);
				const each_array_1 = ensure_array_like(step.apps);
				for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
					let app = each_array_1[$$index];
					$$renderer.push(`<a class="kefine-vpn-guide__pill kefine-vpn-guide__pill--link"${attr("href", app.href)} target="_blank" rel="noreferrer">${escape_html(app.label)}</a>`);
				}
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--> `);
			if (step.exampleVlessLink) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<pre class="kefine-vpn-guide__code"><code>${escape_html(step.exampleVlessLink)}</code></pre>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--> `);
			if (step.linuxClient) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<ol class="kefine-vpn-guide__list"><!--[-->`);
				const each_array_2 = ensure_array_like(step.linuxClient);
				for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
					let item = each_array_2[$$index_1];
					$$renderer.push(`<li>${escape_html(item)}</li>`);
				}
				$$renderer.push(`<!--]--></ol>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--> `);
			if (step.otherClientsNote) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<small class="kefine-vpn-guide__note">${escape_html(step.otherClientsNote)}</small>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--></article>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/lib/components/kefine/KefineExecutingStep.svelte
function KefineExecutingStep($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { currentOrder, execution, isHydratingTitle = false, forceFinalVpnStep = false, labels, authLabels, authDisplay, walletNetworkLabel} = $$props;
		let visibleVpnSteps = 1;
		let elapsedSeconds = 0;
		let copiedSolverHandle = null;
		const isVpnScenario = derived(() => execution.scenario === "vpn-service" && execution.vpnFlow !== null);
		const vpnFlow = derived(() => execution.vpnFlow);
		const genericSteps = derived(() => execution.subtasks.length > 0 ? execution.subtasks.map((subtask) => ({
			id: subtask.id,
			title: subtask.title,
			detail: subtask.detail,
			state: subtask.state
		})) : execution.stageItems.map((item) => ({
			id: item.id,
			title: item.title,
			detail: item.detail,
			state: item.state
		})));
		const activeVpnStep = derived(() => vpnFlow() ? vpnFlow().steps[Math.max(visibleVpnSteps - 1, 0)] : null);
		const activeGenericStepIndex = derived(() => {
			const activeIndex = genericSteps().findIndex((step) => step.state === "active");
			if (activeIndex >= 0) return activeIndex;
			const completedIndex = genericSteps().findLastIndex((step) => step.state === "completed");
			return completedIndex >= 0 ? completedIndex : 0;
		});
		const activeGenericStep = derived(() => genericSteps()[activeGenericStepIndex()] ?? null);
		const orderCompleted = derived(() => currentOrder?.status === "completed" || currentOrder?.status === "done");
		const showVpnEstimate = derived(() => Boolean(isVpnScenario() && activeVpnStep()?.revealExecutionEstimate));
		const showVpnWidget = derived(() => Boolean(isVpnScenario() && activeVpnStep()?.revealWidget));
		const showResolvedVpnWidget = derived(() => Boolean(showVpnWidget() && (forceFinalVpnStep || orderCompleted())));
		const formattedElapsed = derived(() => formatElapsed(elapsedSeconds));
		const vpnProgressPercent = derived(() => vpnFlow() ? Math.max(18, Math.round(visibleVpnSteps / vpnFlow().steps.length * 100)) : 0);
		const genericProgressPercent = derived(() => genericSteps().length > 0 ? Math.max(18, Math.round((activeGenericStepIndex() + 1) / genericSteps().length * 100)) : 0);
		const copyFeedbackLabel = "Copied";
		const vpnStepHeadline = derived(() => activeVpnStep() ? `${vpnFlow()?.labels.step} ${visibleVpnSteps} ${vpnFlow()?.labels.of} ${vpnFlow()?.steps.length} - ${activeVpnStep().badge}` : "");
		const genericStepHeadline = derived(() => activeGenericStep() ? `Step ${activeGenericStepIndex() + 1} of ${Math.max(genericSteps().length, 1)} - ${activeGenericStep().title}` : execution.headline);
		function formatElapsed(totalSeconds) {
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;
			return `${minutes}:${String(seconds).padStart(2, "0")}`;
		}
		function getSolverInitial(handle, name) {
			const firstFromHandle = handle.trim().replace(/^@+/, "").charAt(0);
			if (firstFromHandle) return firstFromHandle.toUpperCase();
			const firstFromName = name.trim().charAt(0);
			return firstFromName ? firstFromName.toUpperCase() : "?";
		}
		$$renderer.push(`<article class="kefine-card kefine-card--wide kefine-order-flow"><section class="kefine-flow-panel kefine-flow-panel--hero"><div class="kefine-flow-topline"><button type="button" class="kefine-flow-back"${attr("aria-label", labels.cancel)}>←</button></div> `);
		if (isHydratingTitle) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<h2 class="kefine-title-skeleton" aria-label="Loading task title"></h2>`);
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push(`<h2>${escape_html(currentOrder?.title)}</h2>`);
		}
		$$renderer.push(`<!--]--> `);
		if (currentOrder?.description && currentOrder.description !== currentOrder.title) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<p class="kefine-flow-copy">${escape_html(currentOrder.description)}</p>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></section> `);
		if (isVpnScenario() && vpnFlow()) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<section class="kefine-flow-panel"><div class="kefine-section-head"><p>${escape_html(vpnFlow().labels.scenario)}</p> <div class="kefine-flow-badges"><span class="kefine-flow-badge kefine-flow-badge--timer">${escape_html(vpnFlow().labels.timer)}: ${escape_html(formattedElapsed())}</span> `);
			if (showVpnEstimate()) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<span class="kefine-flow-badge">${escape_html(vpnFlow().labels.executionEstimate)}: ${escape_html(currentOrder?.executionEstimate)}</span>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--></div></div> <section class="kefine-vpn-progress-panel"><div class="kefine-vpn-progress-meta"><strong>${escape_html(vpnStepHeadline())}</strong> <div class="kefine-vpn-progress-controls"><span>${escape_html(vpnProgressPercent())}%</span> <button type="button" class="kefine-vpn-arrow" aria-label="Previous step"${attr("disabled", visibleVpnSteps <= 1, true)}>←</button> <button type="button" class="kefine-vpn-arrow" aria-label="Next step"${attr("disabled", visibleVpnSteps >= vpnFlow().steps.length, true)}>→</button></div></div> <div class="kefine-vpn-progress-track" aria-hidden="true"><span class="kefine-vpn-progress-fill"${attr_style(`width: ${vpnProgressPercent()}%`)}></span></div> `);
			if (activeVpnStep()) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<!---->`);
				$$renderer.push(`<div class="kefine-vpn-stage-copy"><div class="kefine-vpn-stage-meta"><span class="kefine-vpn-stage-label">${escape_html(vpnFlow().labels.current)}</span> <span class="kefine-flow-badge">${escape_html(vpnFlow().labels.price)}: ${escape_html(execution.primaryMetric.value)} ${escape_html(execution.primaryMetric.unit)}</span></div> <div class="kefine-vpn-solver-row"><span class="kefine-vpn-solver-avatar" aria-hidden="true">${escape_html(getSolverInitial(activeVpnStep().solver.handle, activeVpnStep().solver.name))}</span> <div class="kefine-vpn-solver-copy"><span class="kefine-vpn-solver-name"><strong>${escape_html(activeVpnStep().solver.name)}</strong> <span class="kefine-vpn-solver-actions"><a class="kefine-vpn-icon-action"${attr("href", activeVpnStep().solver.profileUrl)} target="_blank" rel="noreferrer"${attr("aria-label", vpnFlow().labels.profile)}${attr("title", vpnFlow().labels.profile)}>`);
				Icon($$renderer, {
					icon: "mdi:open-in-new",
					width: "16",
					height: "16",
					"aria-hidden": "true"
				});
				$$renderer.push(`<!----></a> <button type="button" class="kefine-vpn-icon-action"${attr("aria-label", copiedSolverHandle === activeVpnStep().solver.handle ? copyFeedbackLabel : vpnFlow().labels.copy)}${attr("title", copiedSolverHandle === activeVpnStep().solver.handle ? copyFeedbackLabel : vpnFlow().labels.copy)}>`);
				Icon($$renderer, {
					icon: copiedSolverHandle === activeVpnStep().solver.handle ? "mdi:check" : "mdi:content-copy",
					width: "14",
					height: "14",
					"aria-hidden": "true"
				});
				$$renderer.push(`<!----></button></span></span> <span>${escape_html(activeVpnStep().solver.handle)}</span></div></div> `);
				if (!showVpnWidget()) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<h3>${escape_html(activeVpnStep().title)}</h3> <p>${escape_html(activeVpnStep().detail)}</p>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--></div>`);
				$$renderer.push(`<!---->`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--></section></section> `);
			if (showVpnWidget()) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<section class="kefine-flow-panel" data-testid="kefine-vpn-widget-panel"><div class="kefine-vpn-widget-surface">`);
				if (showResolvedVpnWidget()) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="kefine-vpn-widget-body"><strong>${escape_html(currentOrder?.vpnGuide?.title ?? vpnFlow().widget.title)}</strong> <p>${escape_html(currentOrder?.vpnGuide?.summary ?? vpnFlow().widget.summary)}</p> `);
					if (currentOrder?.vpnGuide) {
						$$renderer.push("<!--[-->");
						KefineVpnGuide($$renderer, { guide: currentOrder.vpnGuide });
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push(`<div class="kefine-vpn-widget-lines" aria-hidden="true"><span></span> <span></span> <span></span></div>`);
					}
					$$renderer.push(`<!--]--></div>`);
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push(`<div class="kefine-vpn-widget-body"><strong>${escape_html(vpnFlow().widget.title)}</strong> <p>${escape_html(vpnFlow().widget.summary)}</p> `);
					if (activeVpnStep()?.instructions && activeVpnStep().instructions.length > 0) {
						$$renderer.push("<!--[-->");
						$$renderer.push(`<div class="kefine-vpn-instruction-list"><!--[-->`);
						const each_array = ensure_array_like(activeVpnStep().instructions);
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let instruction = each_array[$$index];
							$$renderer.push(`<article class="kefine-vpn-instruction-card"><strong>${escape_html(instruction.title)}</strong> <p>${escape_html(instruction.detail)}</p></article>`);
						}
						$$renderer.push(`<!--]--></div>`);
					} else $$renderer.push("<!--[!-->");
					$$renderer.push(`<!--]--> <div class="kefine-vpn-widget-lines" aria-hidden="true"><span></span> <span></span> <span></span></div></div> <div class="kefine-vpn-widget-overlay"></div> <div class="kefine-vpn-widget-gate">`);
					{
						$$renderer.push("<!--[-->");
						$$renderer.push(`<span class="kefine-flow-badge kefine-flow-badge--timer">${escape_html(vpnFlow().labels.price)}: ${escape_html(execution.primaryMetric.value)} ${escape_html(execution.primaryMetric.unit)}</span> <strong>Open result</strong> <p>Choose how to continue to the solver result.</p> <div class="kefine-vpn-widget-actions kefine-auth-grid"><button type="button" class="kefine-auth-tile kefine-auth-tile--wallet"><div class="kefine-auth-hero kefine-auth-hero--wallet" aria-hidden="true">`);
						KefineWalletProviderGrid($$renderer);
						$$renderer.push(`<!----></div> <strong>Login</strong></button> <button type="button" class="kefine-auth-tile kefine-auth-tile--anonymous"><div class="kefine-auth-hero kefine-auth-hero--guest" aria-hidden="true"><span class="kefine-test-badge">10 min</span></div> <strong>Test Now</strong></button> <button type="button" class="kefine-auth-tile kefine-auth-tile--passkey"><div class="kefine-auth-hero kefine-auth-hero--passkey" aria-hidden="true"><span class="kefine-auth-icon">`);
						Icon($$renderer, {
							icon: KEFINE_AUTH_ICONS.passkey,
							width: "100%",
							height: "100%",
							"aria-hidden": "true"
						});
						$$renderer.push(`<!----></span></div> <strong>Passkey</strong></button></div>`);
					}
					$$renderer.push(`<!--]--></div>`);
				}
				$$renderer.push(`<!--]--></div></section>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push(`<section class="kefine-flow-panel"><div class="kefine-section-head"><p>${escape_html(execution.eyebrow)}</p> <div class="kefine-flow-badges"><span class="kefine-flow-badge kefine-flow-badge--timer">${escape_html(labels.timeLeft)}: ${escape_html(formattedElapsed())}</span> <span class="kefine-flow-badge">${escape_html(labels.timeLeft)}: ${escape_html(execution.secondaryMetric.value)} ${escape_html(execution.secondaryMetric.unit)}</span> <span class="kefine-flow-badge">${escape_html(labels.price)}: ${escape_html(execution.primaryMetric.value)} ${escape_html(execution.primaryMetric.unit)}</span></div></div> <section class="kefine-vpn-progress-panel"><div class="kefine-vpn-progress-meta"><strong>${escape_html(genericStepHeadline())}</strong> <span>${escape_html(genericProgressPercent())}%</span></div> <div class="kefine-vpn-progress-track" aria-hidden="true"><span class="kefine-vpn-progress-fill"${attr_style(`width: ${genericProgressPercent()}%`)}></span></div> <div class="kefine-vpn-stage-copy"><div class="kefine-vpn-stage-meta"><span class="kefine-vpn-stage-label">Now</span> <span class="kefine-flow-badge">${escape_html(labels.price)}: ${escape_html(execution.primaryMetric.value)} ${escape_html(execution.primaryMetric.unit)}</span></div> `);
			if (currentOrder?.solver) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<div class="kefine-vpn-solver-row"><span class="kefine-vpn-solver-avatar" aria-hidden="true">${escape_html(getSolverInitial(currentOrder.solver, currentOrder.solver))}</span> <div class="kefine-vpn-solver-copy"><span class="kefine-vpn-solver-name"><strong>${escape_html(currentOrder.solver)}</strong></span></div></div>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--> `);
			if (activeGenericStep()) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<h3>${escape_html(activeGenericStep().title)}</h3> <p>${escape_html(activeGenericStep().detail)}</p>`);
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push(`<h3>${escape_html(execution.headline)}</h3> <p>${escape_html(execution.supportingText)}</p>`);
			}
			$$renderer.push(`<!--]--> `);
			if (genericSteps().length > 1) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<div class="kefine-vpn-instruction-list" data-testid="kefine-subtask-list"><!--[-->`);
				const each_array_1 = ensure_array_like(genericSteps());
				for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
					let stepItem = each_array_1[index];
					$$renderer.push(`<article class="kefine-vpn-instruction-card"${attr("data-state", stepItem.state)}><strong>Step ${escape_html(index + 1)}</strong> <p>${escape_html(stepItem.title)}</p></article>`);
				}
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--></div></section></section>`);
		}
		$$renderer.push(`<!--]--> `);
		if (!isVpnScenario() && orderCompleted()) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<section class="kefine-flow-panel"><div class="kefine-section-head"><p>${escape_html(labels.chooseMethod)}</p></div> <div class="kefine-auth-grid"><button type="button" class="kefine-auth-tile kefine-auth-tile--wallet"${attr("data-active", authDisplay.activeMethod === "wallet")} data-testid="kefine-wallet-tile"><div class="kefine-auth-hero kefine-auth-hero--wallet" aria-hidden="true">`);
			KefineWalletProviderGrid($$renderer);
			$$renderer.push(`<!----></div> `);
			if (authDisplay.walletLabel) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<strong>${escape_html(authDisplay.walletLabel)}</strong>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--> `);
			if (authDisplay.activeMethod === "wallet") {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<small>${escape_html(authDisplay.walletLabel ? walletNetworkLabel : `${authLabels.walletAccount}: ${walletNetworkLabel}`)}</small>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--></button> <button type="button" class="kefine-auth-tile kefine-auth-tile--passkey"${attr("data-active", authDisplay.activeMethod === "passkey")} data-testid="kefine-passkey-tile"><div class="kefine-auth-hero kefine-auth-hero--passkey" aria-hidden="true"><span class="kefine-auth-icon">`);
			Icon($$renderer, {
				icon: KEFINE_AUTH_ICONS.passkey,
				width: "100%",
				height: "100%",
				"aria-hidden": "true"
			});
			$$renderer.push(`<!----></span></div> <strong>${escape_html(authLabels.passkeyTitle)}</strong> `);
			if (authDisplay.passkeyLabel) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<small>${escape_html(authDisplay.passkeyLabel)}</small>`);
			} else $$renderer.push("<!--[!-->");
			$$renderer.push(`<!--]--></button> <button type="button" class="kefine-auth-tile kefine-auth-tile--anonymous"${attr("data-active", authDisplay.activeMethod === "anonymous")} data-testid="kefine-anonymous-tile"><div class="kefine-auth-hero kefine-auth-hero--guest" aria-hidden="true"><span class="kefine-test-badge">10</span></div> <strong>${escape_html(authLabels.anonymousTitle)}</strong> <small>${escape_html(authLabels.anonymousDetail)}</small></button></div></section>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></article>`);
	});
}
var vpn_flow_mock_default = {
	stepDelaysMs: [
		1200,
		1700,
		1900,
		1600
	],
	labels: {
		"scenario": "VPN service runbook",
		"current": "Current phase",
		"next": "Up next",
		"step": "Step",
		"of": "of",
		"timer": "ETA",
		"profile": "Solver profile",
		"copy": "Workflow notes",
		"executionEstimate": "Execution window",
		"price": "Price",
		"widget": "Delivery widget"
	},
	steps: [
		{
			"id": "vpn-discovery",
			"badge": "Routing",
			"title": "Network requirements are analysed",
			"detail": "Resolvers inspect regions, protocol support, and the target team footprint before selecting a route.",
			"revealSolver": false,
			"revealExecutionEstimate": false,
			"revealPrice": false,
			"revealWidget": false,
			"solver": {
				"name": "Route Scout",
				"handle": "@route-scout",
				"profileUrl": "https://solver.market/@route-scout"
			}
		},
		{
			"id": "vpn-pricing",
			"badge": "Quote",
			"title": "Solver quote is locked in",
			"detail": "The best route is chosen and the solver publishes the setup cost together with the execution window.",
			"revealSolver": true,
			"revealExecutionEstimate": true,
			"revealPrice": true,
			"revealWidget": false,
			"solver": {
				"name": "Pricing Oracle",
				"handle": "@pricing-oracle",
				"profileUrl": "https://solver.market/@pricing-oracle"
			}
		},
		{
			"id": "vpn-deploying",
			"badge": "Provisioning",
			"title": "Managed VPN endpoint is being prepared",
			"detail": "The winning solver provisions the selected region, injects the credentials, and seals the guest profile.",
			"revealSolver": true,
			"revealExecutionEstimate": true,
			"revealPrice": true,
			"revealWidget": false,
			"solver": {
				"name": "Infra Forge",
				"handle": "@infra-forge",
				"profileUrl": "https://solver.market/@infra-forge"
			}
		},
		{
			"id": "vpn-ready",
			"badge": "Solver",
			"title": "Access package is staged",
			"detail": "Unlock the solver result screen to reveal the connection package for your access mode.",
			"revealSolver": true,
			"revealExecutionEstimate": true,
			"revealPrice": true,
			"revealWidget": true,
			"solver": {
				"name": "Delivery Relay",
				"handle": "@delivery-relay",
				"profileUrl": "https://solver.market/@delivery-relay"
			},
			"instructions": [{
				"title": "Guest route",
				"detail": "Use the temporary profile to test the endpoint for 10 minutes before committing funds."
			}, {
				"title": "Permanent route",
				"detail": "Complete payment to receive the durable configuration bundle and fallback credentials."
			}]
		}
	],
	widget: {
		"title": "VPN delivery widget",
		"summary": "The solver package is ready to be opened after authentication and payment are confirmed.",
		"badge": "Delivery"
	}
};
//#endregion
//#region src/lib/components/kefine/kefine-workflow-parsers.ts
function isRecord(value) {
	return typeof value === "object" && value !== null;
}
function toRecord(value) {
	return isRecord(value) ? value : null;
}
function toStringValue$1(value) {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
}
function toNumber$1(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : void 0;
	}
}
function detectVpnScenario(payload) {
	const source = `${payload.title} ${payload.description}`.toLowerCase();
	return /\bvpn\b/.test(source) || source.includes("telegram") || source.includes("телеграм");
}
function toUiScenario(value) {
	return value === "vpn-service" ? value : void 0;
}
function inferExecutionEstimate(title, localeText) {
	const normalizedTitle = title.trim().toLowerCase();
	if (!normalizedTitle) return;
	const isRussianLocale = localeText.meta.locale === "ru";
	if (normalizedTitle.includes("optimize an algorithm") || normalizedTitle.includes("algorithm optimization") || normalizedTitle.includes("оптимизация алгоритма")) return isRussianLocale ? "около 2 часов" : "about 2 hours";
	if (normalizedTitle.includes("deploy") || normalizedTitle.includes("production app") || normalizedTitle.includes("деплой")) return isRussianLocale ? "около 3 часов" : "about 3 hours";
	if (normalizedTitle.includes("telegram") || normalizedTitle.includes("access") || normalizedTitle.includes("доступ")) return isRussianLocale ? "около 45 минут" : "about 45 minutes";
	return isRussianLocale ? "около 1 часа" : "about 1 hour";
}
function resolveExecutionEstimate$1(executionEstimate, title, localeText) {
	return toStringValue$1(executionEstimate) || inferExecutionEstimate(title, localeText);
}
function unwrapActivityObject(payload) {
	const record = toRecord(payload);
	if (!record) return null;
	const type = toStringValue$1(record["type"]);
	if ((type === "Create" || type === "Update") && isRecord(record["object"])) return toRecord(record["object"]);
	return record;
}
function unwrapTicketPayload(payload) {
	if (toStringValue$1(payload["type"]) === "Offer" && isRecord(payload["object"])) {
		const nested = toRecord(payload["object"]);
		if (nested && toStringValue$1(nested["type"]) === "Ticket") return nested;
	}
	return payload;
}
function toRecordList(value) {
	if (!Array.isArray(value)) return [];
	return value.map((item) => toRecord(item)).filter((item) => item !== null);
}
function toStringList(value) {
	if (!Array.isArray(value)) return void 0;
	const items = value.map((item) => typeof item === "string" && item.trim() ? item.trim() : null).filter((item) => item !== null);
	return items.length > 0 ? items : void 0;
}
function extractHref(payload) {
	return toStringValue$1(payload["href"]) || toStringValue$1(payload["url"]);
}
function extractActorLabel(actor) {
	if (typeof actor === "string") return actor;
	const record = toRecord(actor);
	if (!record) return;
	return toStringValue$1(record["name"]) || toStringValue$1(record["preferredUsername"]) || toStringValue$1(record["id"]);
}
function findPaymentLink(payload) {
	const attachments = toRecordList(payload["attachment"]);
	const candidates = [
		toRecord(payload["paymentLink"]),
		toRecord(payload["price"]),
		...attachments
	].filter((item) => item !== null);
	for (const candidate of candidates) {
		const type = toStringValue$1(candidate["type"]);
		const rel = candidate["rel"];
		const relValues = typeof rel === "string" ? [rel] : Array.isArray(rel) ? rel.filter((value) => typeof value === "string") : [];
		if (type === "PaymentLink" || relValues.some((value) => /payment|price/i.test(value)) || toNumber$1(candidate["price"]) !== void 0 || toNumber$1(candidate["amount"]) !== void 0) return candidate;
	}
	return null;
}
function findVpnGuideAttachment(payload) {
	for (const candidate of toRecordList(payload["attachment"])) {
		const mediaType = toStringValue$1(candidate["mediaType"]);
		const type = toStringValue$1(candidate["type"]);
		if (mediaType === "application/vnd.kefine.vpn-guide+json" || type === "Document" && toStringValue$1(candidate["name"])?.toLowerCase().includes("vpn")) return candidate;
	}
	return null;
}
function toStringArray(value) {
	return toStringList(value);
}
function toLinkArray(value) {
	if (!Array.isArray(value)) return void 0;
	const items = value.map((item) => toRecord(item)).filter((item) => item !== null).map((item) => {
		const label = toStringValue$1(item["label"]);
		const href = toStringValue$1(item["href"]);
		return label && href ? {
			label,
			href
		} : null;
	}).filter((item) => item !== null);
	return items.length > 0 ? items : void 0;
}
function extractVpnGuide(payload) {
	const attachment = findVpnGuideAttachment(payload);
	const content = toRecord(attachment?.["content"]);
	if (!attachment || !content) return;
	const steps = (Array.isArray(content["steps"]) ? content["steps"] : []).map((item) => toRecord(item)).filter((item) => item !== null).map((step) => {
		const id = toStringValue$1(step["id"]);
		const title = toStringValue$1(step["title"]);
		const summary = toStringValue$1(step["summary"]);
		if (!id || !title || !summary) return null;
		return {
			id,
			title,
			summary,
			apps: toLinkArray(step["apps"]),
			exampleVlessLink: toStringValue$1(step["exampleVlessLink"]),
			linuxClient: toStringArray(step["linuxClient"]),
			otherClientsNote: toStringValue$1(step["otherClientsNote"])
		};
	}).filter((step) => step !== null);
	if (steps.length === 0) return;
	return {
		title: toStringValue$1(attachment["name"]) || "VPN delivery guide",
		summary: toStringValue$1(attachment["summary"]) || "VPN setup instructions",
		steps
	};
}
function readCreateResponse(body) {
	if (!isRecord(body) || body["accepted"] !== true) return null;
	const orderId = toStringValue$1(body["orderId"]);
	if (!orderId) return null;
	return {
		orderId,
		solver: toStringValue$1(body["solver"]) || void 0,
		status: toStringValue$1(body["status"]) || "queued",
		uiScenario: toUiScenario(body["uiScenario"])
	};
}
function extractStatusPayload(payload, fallback, localeText) {
	const rootPayload = toRecord(payload);
	const activityOrObject = unwrapActivityObject(payload);
	if (!activityOrObject) return null;
	const source = activityOrObject;
	const ticket = unwrapTicketPayload(source);
	const paymentLink = findPaymentLink(source) || findPaymentLink(ticket);
	const vpnGuide = extractVpnGuide(source) || extractVpnGuide(ticket);
	const orderId = toStringValue$1(source["orderId"]) || toStringValue$1(source["id"]) || toStringValue$1(ticket["orderId"]) || toStringValue$1(ticket["id"]);
	if (!orderId) return null;
	const title = toStringValue$1(source["title"]) || toStringValue$1(source["name"]) || toStringValue$1(ticket["title"]) || toStringValue$1(ticket["name"]) || fallback.title;
	const createdAt = toStringValue$1(source["createdAt"]) || toStringValue$1(source["published"]) || toStringValue$1(ticket["createdAt"]) || toStringValue$1(ticket["published"]) || fallback.createdAt;
	const linkedPrice = toNumber$1(paymentLink?.["price"]) ?? toNumber$1(paymentLink?.["amount"]);
	const linkedCurrency = toStringValue$1(paymentLink?.["currency"]) || void 0;
	const linkedSolver = extractActorLabel(paymentLink?.["attributedTo"]) || extractActorLabel(source["attributedTo"]) || extractActorLabel(ticket["attributedTo"]) || void 0;
	return {
		id: orderId,
		solver: toStringValue$1(source["solver"]) || linkedSolver || localeText.defaults.solverNetwork,
		status: toStringValue$1(source["status"]) || toStringValue$1(ticket["status"]) || "queued",
		title,
		description: toStringValue$1(source["description"]) || toStringValue$1(source["content"]) || toStringValue$1(ticket["description"]) || toStringValue$1(ticket["content"]) || fallback.description,
		createdAt,
		estimatedCost: linkedPrice ?? toNumber$1(source["estimatedCost"]) ?? toNumber$1(source["price"]) ?? toNumber$1(ticket["estimatedCost"]) ?? toNumber$1(ticket["price"]) ?? void 0,
		currency: linkedCurrency || toStringValue$1(source["currency"]) || toStringValue$1(ticket["currency"]) || fallback.currency,
		executionEstimate: resolveExecutionEstimate$1(toStringValue$1(source["executionEstimate"]) || toStringValue$1(ticket["executionEstimate"]) || toStringValue$1(ticket["dueDate"]) || void 0, title, localeText),
		paymentUrl: extractHref(paymentLink ?? {}) || toStringValue$1(source["paymentUrl"]) || void 0,
		uiScenario: toUiScenario(source["uiScenario"]) || toUiScenario(ticket["uiScenario"]),
		labels: toStringList(source["labels"]) || toStringList(ticket["labels"]),
		vpnGuide,
		activitypub: rootPayload || void 0
	};
}
function buildCreatePayload(payload) {
	const isVpnScenario = detectVpnScenario(payload);
	const fileAttachments = payload.files.map((file) => ({
		type: "Document",
		name: file.name,
		mediaType: file.type || "application/octet-stream",
		size: file.size
	}));
	return {
		name: payload.title,
		title: payload.title,
		content: payload.description,
		description: payload.description,
		estimatedCost: toNumber$1(payload.estimatedCost) || 0,
		currency: payload.currency,
		executionEstimate: payload.executionEstimate || void 0,
		uiScenario: isVpnScenario ? "vpn-service" : void 0,
		labels: isVpnScenario ? ["vpn"] : void 0,
		attachment: fileAttachments.length > 0 ? fileAttachments : void 0
	};
}
//#endregion
//#region src/lib/components/kefine/kefine-workflow.ts
function isVpnOrder(order) {
	if (!order) return false;
	if (order.uiScenario === "vpn-service") return true;
	if ((Array.isArray(order.labels) ? order.labels : []).some((label) => /(?:^|\W)(vpn|vless|wireguard|outline)(?:$|\W)|telegram|телеграм/i.test(label))) return true;
	const source = `${order.title ?? ""} ${order.description ?? ""}`.toLowerCase();
	return /\bvpn\b/.test(source) || source.includes("telegram") || source.includes("телеграм");
}
var POLL_INTERVAL_MS = 1500;
var EXECUTION_STAGE_ORDER = [
	"batching",
	"competition",
	"winner-selected",
	"bridging",
	"awaiting-auth",
	"awaiting-payment"
];
function toNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : void 0;
	}
}
function toStringValue(value) {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
}
function splitEstimate(value, localeText) {
	const raw = toStringValue(value);
	if (!raw) return {
		value: "1",
		unit: localeText.labels.hoursUnit
	};
	const valuePart = raw.match(/(\d+(?:[.,]\d+)?)/)?.[1]?.replace(",", ".") ?? "1";
	const normalized = raw.toLowerCase();
	if (normalized.includes("min") || normalized.includes("мин")) return {
		value: valuePart,
		unit: localeText.labels.minutesUnit
	};
	return {
		value: valuePart,
		unit: localeText.labels.hoursUnit
	};
}
function formatAmountValue(amount) {
	if (amount === void 0) return "0";
	return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, "");
}
function resolveExecutionEstimate(executionEstimate, title, localeText) {
	const normalizedEstimate = typeof executionEstimate === "string" && executionEstimate.trim().length > 0 ? executionEstimate.trim() : void 0;
	if (normalizedEstimate) return normalizedEstimate;
	const normalizedTitle = title.trim().toLowerCase();
	if (!normalizedTitle) return;
	const isRussianLocale = localeText.meta.locale === "ru";
	if (normalizedTitle.includes("optimize an algorithm") || normalizedTitle.includes("algorithm optimization") || normalizedTitle.includes("оптимизация алгоритма")) return isRussianLocale ? "около 2 часов" : "about 2 hours";
	if (normalizedTitle.includes("deploy") || normalizedTitle.includes("production app") || normalizedTitle.includes("деплой")) return isRussianLocale ? "около 3 часов" : "about 3 hours";
	if (normalizedTitle.includes("telegram") || normalizedTitle.includes("access") || normalizedTitle.includes("доступ")) return isRussianLocale ? "около 45 минут" : "about 45 minutes";
	return isRussianLocale ? "около 1 часа" : "about 1 hour";
}
function deriveExecutionStage(order, authMethod, paymentReady) {
	if (!order) return "batching";
	if (paymentReady) return "awaiting-payment";
	if (order.status === "completed") return authMethod ? "awaiting-payment" : "awaiting-auth";
	if (order.status === "accepted" || order.status === "executing") return "bridging";
	if (order.status === "stopped") return "competition";
	return "competition";
}
function buildStageItems(stage, localeText) {
	const currentIndex = EXECUTION_STAGE_ORDER.indexOf(stage);
	return [
		{
			id: "batching",
			title: localeText.executionFlow.batching.title,
			detail: localeText.executionFlow.batching.detail,
			state: currentIndex > 0 ? "completed" : currentIndex === 0 ? "active" : "upcoming"
		},
		{
			id: "competition",
			title: localeText.executionFlow.competition.title,
			detail: localeText.executionFlow.competition.detail,
			state: currentIndex > 1 ? "completed" : currentIndex === 1 ? "active" : "upcoming"
		},
		{
			id: "winner-selected",
			title: localeText.executionFlow.winnerSelected.title,
			detail: localeText.executionFlow.winnerSelected.detail,
			state: currentIndex > 2 ? "completed" : currentIndex === 2 ? "active" : "upcoming"
		},
		{
			id: "bridging",
			title: localeText.executionFlow.bridging.title,
			detail: localeText.executionFlow.bridging.detail,
			state: currentIndex > 3 ? "completed" : currentIndex === 3 ? "active" : "upcoming"
		}
	];
}
function buildOrderSubtasks(order, localeText) {
	const normalizedTitle = order?.title.trim().toLowerCase() ?? "";
	if (!normalizedTitle) return [];
	return (normalizedTitle.includes("deploy") || normalizedTitle.includes("production") ? [
		localeText.subtasks.prepareConfig,
		localeText.subtasks.runChecks,
		localeText.subtasks.publishResult
	] : normalizedTitle.includes("optimize") || normalizedTitle.includes("algorithm") ? [
		localeText.subtasks.profileCode,
		localeText.subtasks.benchmarkPaths,
		localeText.subtasks.publishResult
	] : normalizedTitle.includes("telegram") || normalizedTitle.includes("access") ? [] : [
		localeText.subtasks.prepareConfig,
		localeText.subtasks.syncArtifacts,
		localeText.subtasks.publishResult
	]).map((item, index) => ({
		id: item.id,
		title: item.title,
		detail: item.detail,
		state: index === 0 ? "completed" : index === 1 ? "active" : "upcoming"
	}));
}
function deriveExecutionPresentation(order, localeText, authMethod, paymentReady) {
	const stage = deriveExecutionStage(order, authMethod, paymentReady);
	const stageConfig = localeText.executionFlow[stage === "winner-selected" ? "winnerSelected" : stage];
	const estimate = splitEstimate(order?.executionEstimate, localeText);
	const isVpnScenario = isVpnOrder(order);
	const vpnFlow = isVpnScenario ? {
		stepDelaysMs: vpn_flow_mock_default.stepDelaysMs,
		labels: vpn_flow_mock_default.labels,
		steps: vpn_flow_mock_default.steps,
		widget: vpn_flow_mock_default.widget
	} : null;
	return {
		scenario: isVpnScenario ? "vpn-service" : "default",
		stage,
		eyebrow: localeText.labels.taskStatus,
		headline: stageConfig.title,
		supportingText: stageConfig.detail,
		stageItems: buildStageItems(stage, localeText),
		subtasks: buildOrderSubtasks(order, localeText),
		vpnFlow,
		primaryMetric: {
			label: localeText.labels.price,
			value: formatAmountValue(order?.estimatedCost),
			unit: order?.currency ?? localeText.defaults.defaultCurrency
		},
		secondaryMetric: {
			label: localeText.labels.timeLeft,
			value: estimate.value,
			unit: estimate.unit
		}
	};
}
//#endregion
//#region src/lib/components/kefine/KefinePaymentStep.svelte
function KefinePaymentStep($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { currentOrder, selectedAuthMethod, paymentStage, isAuthenticated, labels, paymentLabels, resultLabels, authLabels, authDisplay, buttons} = $$props;
		let promoCode = "";
		let paymentQuote = null;
		let promoApplying = false;
		const VPN_GUEST_ACCESS_MS = 600 * 1e3;
		const showVpnResultWidget = derived(() => isVpnOrder(currentOrder) && paymentStage === "result-ready");
		const vpnGuideAvailable = derived(() => isVpnOrder(currentOrder) && paymentStage === "result-ready" && Boolean(currentOrder?.vpnGuide));
		const guestResultAccess = derived(() => vpnGuideAvailable() && (isAuthenticated || selectedAuthMethod === "anonymous"));
		const effectivePaymentAmount = derived(() => currentOrder?.estimatedCost ?? 0);
		const effectivePaymentCurrency = derived(() => currentOrder?.currency ?? "USDC");
		const payButtonLabel = derived(() => {
			const amount = effectivePaymentAmount();
			const currency = effectivePaymentCurrency();
			return `Pay ${Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, "")} ${currency}`.trim();
		});
		const guestAccessRemainingMs = derived(() => {
			if (!guestResultAccess() || true) return VPN_GUEST_ACCESS_MS;
		});
		const guestAccessExpired = derived(() => guestResultAccess() && guestAccessRemainingMs() <= 0);
		const guestAccessTimerLabel = derived(() => {
			const totalSeconds = Math.ceil(guestAccessRemainingMs() / 1e3);
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;
			return `${String(Math.max(0, minutes)).padStart(2, "0")}:${String(Math.max(0, seconds)).padStart(2, "0")}`;
		});
		const quoteReady = derived(() => paymentQuote !== null);
		const paymentRequestLabel = derived(() => "EVM payment");
		const qrPayload = derived(() => null);
		const qrImageUrl = derived(() => {
			if (!qrPayload()) return null;
			return `https://api.qrserver.com/v1/create-qr-code/?${new URLSearchParams({
				size: "320x320",
				format: "svg",
				data: qrPayload()
			}).toString()}`;
		});
		const compactPaymentAddress = derived(() => "Waiting for crater payment address");
		function formatAmount(amount) {
			if (amount === void 0) return "0";
			return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, "");
		}
		function resolveExpiredActionLabel() {
			return "Request again";
		}
		$$renderer.push(`<article${attr_class("kefine-card kefine-card--wide kefine-order-flow", void 0, { "kefine-result-mode": paymentStage === "result-ready" })}><div class="kefine-result-background"${attr("aria-hidden", paymentStage === "result-ready")}><section class="kefine-payment-layout kefine-payment-layout--fadein" data-testid="kefine-payment-redesign"><div class="kefine-payment-layout__left"><div class="kefine-payment-panel"><div class="kefine-section-head"><p>${escape_html(paymentRequestLabel())}</p> `);
		$$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></div> <div class="kefine-payment-qr-surface">`);
		if (qrImageUrl()) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<img class="kefine-payment-qr-image"${attr("src", qrImageUrl())} alt="Payment QR code" loading="eager"/>`);
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push(`<div class="kefine-payment-qr-placeholder">`);
			Icon($$renderer, {
				icon: "mdi:qrcode",
				width: "72",
				height: "72",
				"aria-hidden": "true"
			});
			$$renderer.push(`<!----> <small>QR will appear when payment details are ready.</small></div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="kefine-payment-address-block"><span class="kefine-payment-address-label">EVM address</span> <code>${escape_html(compactPaymentAddress())}</code></div></div></div> <div class="kefine-payment-layout__right"><div class="kefine-payment-panel kefine-payment-panel--pricing"><div class="kefine-section-head"><p>${escape_html(paymentLabels.summaryTitle)}</p> `);
		if (currentOrder?.id) {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<span class="kefine-payment-chip">${escape_html(labels.taskId)} ${escape_html(currentOrder.id)}</span>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></div> <div class="kefine-payment-hero"><strong>${escape_html(currentOrder?.title ?? labels.resultTitle)}</strong> <p>${escape_html(currentOrder?.executionEstimate ? `${labels.executionEstimate} ${currentOrder.executionEstimate}` : paymentLabels.payCtaHint)}</p></div> <div class="kefine-payment-price-stack">`);
		$$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> <strong class="kefine-payment-price-current">${escape_html(formatAmount(currentOrder?.estimatedCost))} ${escape_html(currentOrder?.currency)}</strong></div> <div class="kefine-promo-block kefine-promo-block--payment"><label class="kefine-promo-label" for="payment-promo-code">${escape_html(paymentLabels.promoCodeLabel)}</label> <div class="kefine-promo-row"><input id="payment-promo-code" class="kefine-promo-input" type="text"${attr("value", promoCode)}${attr("placeholder", paymentLabels.promoCodePlaceholder)} autocomplete="off" data-testid="kefine-payment-promo-input"/> <button type="button" data-variant="primary"${attr("disabled", promoApplying, true)}>${escape_html(buttons.apply)}</button></div> `);
		$$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></div> `);
		$$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> <div class="kefine-payment-action-row"><button type="button" data-variant="primary"${attr("disabled", !quoteReady() && true, true)}>`);
		{
			$$renderer.push("<!--[!-->");
			$$renderer.push(`${escape_html(payButtonLabel())}`);
		}
		$$renderer.push(`<!--]--></button></div></div></div></section></div> `);
		if (paymentStage === "result-ready") {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<section class="kefine-result-overlay" data-testid="kefine-result-panel"><div${attr_class("kefine-result-shell", void 0, { "kefine-result-shell--auth-gate": !showVpnResultWidget() && !guestResultAccess() && !isAuthenticated })}><div class="kefine-result-header"><button type="button" class="kefine-flow-back" aria-label="Back">←</button> <div class="kefine-result-title-block"><p>Completed your task: ${escape_html(currentOrder?.title ?? "-")}</p></div> <div class="kefine-result-actions"><span class="kefine-flow-badge kefine-flow-badge--timer">${escape_html(guestAccessTimerLabel())}</span> <button type="button" data-variant="ghost">${escape_html(payButtonLabel())}</button> <button type="button" data-variant="ghost">View stages</button> <button type="button" data-variant="ghost">${escape_html(buttons.rejectResult)}</button></div></div> <div class="kefine-result-summary"><span class="kefine-payment-chip">${escape_html(labels.executionEstimate)} ${escape_html(currentOrder?.executionEstimate ?? "-")}</span></div> `);
			if (showVpnResultWidget()) {
				$$renderer.push("<!--[-->");
				$$renderer.push(`<div class="kefine-vpn-widget-surface"><div class="kefine-vpn-widget-body"><strong>${escape_html(currentOrder?.vpnGuide?.title ?? labels.resultTitle)}</strong> <p>${escape_html(currentOrder?.vpnGuide?.summary ?? "The VPN delivery widget is ready for this completed order.")}</p> `);
				if (currentOrder?.vpnGuide) {
					$$renderer.push("<!--[-->");
					KefineVpnGuide($$renderer, { guide: currentOrder.vpnGuide });
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push(`<div class="kefine-vpn-widget-lines" aria-hidden="true"><span></span> <span></span> <span></span></div>`);
				}
				$$renderer.push(`<!--]--></div></div> `);
				if (!isAuthenticated) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="kefine-vpn-guide__fallback"><p>Sign in is optional for this completed VPN task. The delivery widget is already available.</p></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]-->`);
			} else if (guestResultAccess() && currentOrder?.vpnGuide) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`<div${attr_class("kefine-vpn-guide", void 0, { "kefine-vpn-guide--blurred": guestAccessExpired() })}><header class="kefine-vpn-guide__header"><strong>${escape_html(currentOrder.vpnGuide.title)}</strong> <p>${escape_html(currentOrder.vpnGuide.summary)}</p></header> `);
				KefineVpnGuide($$renderer, { guide: currentOrder.vpnGuide });
				$$renderer.push(`<!----></div> `);
				if (guestAccessExpired()) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<div class="kefine-vpn-guide__expired-gate"><span class="kefine-flow-badge kefine-flow-badge--timer">Guest access expired</span> <strong>Continue when you need the package again</strong> <p>The 10 minute preview has ended.</p> <div class="kefine-vpn-guide__expired-actions"><button type="button" data-variant="primary">${escape_html(resolveExpiredActionLabel())}</button> <button type="button" data-variant="ghost">${escape_html(payButtonLabel())}</button></div></div>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]-->`);
			} else if (!isAuthenticated) {
				$$renderer.push("<!--[2-->");
				$$renderer.push(`<div class="kefine-auth-grid"><button type="button" class="kefine-auth-tile kefine-auth-tile--wallet" data-testid="kefine-result-wallet-tile"><div class="kefine-auth-hero kefine-auth-hero--wallet" aria-hidden="true">`);
				KefineWalletProviderGrid($$renderer);
				$$renderer.push(`<!----></div> <strong>${escape_html(authDisplay.walletLabel ?? authLabels.walletTitle)}</strong> <small>${escape_html(authLabels.walletAccount)}</small></button> <button type="button" class="kefine-auth-tile kefine-auth-tile--passkey" data-testid="kefine-result-passkey-tile"><div class="kefine-auth-hero kefine-auth-hero--passkey" aria-hidden="true"><span class="kefine-auth-icon">`);
				Icon($$renderer, {
					icon: KEFINE_AUTH_ICONS.passkey,
					width: "100%",
					height: "100%",
					"aria-hidden": "true"
				});
				$$renderer.push(`<!----></span></div> <strong>${escape_html(authLabels.passkeyTitle)}</strong> `);
				if (authDisplay.passkeyLabel) {
					$$renderer.push("<!--[-->");
					$$renderer.push(`<small>${escape_html(authDisplay.passkeyLabel)}</small>`);
				} else $$renderer.push("<!--[!-->");
				$$renderer.push(`<!--]--></button> <button type="button" class="kefine-auth-tile kefine-auth-tile--anonymous" data-testid="kefine-result-anonymous-tile"><div class="kefine-auth-hero kefine-auth-hero--guest" aria-hidden="true"><span class="kefine-test-badge">10</span></div> <strong>${escape_html(authLabels.anonymousTitle)}</strong> <small>${escape_html(authLabels.anonymousDetail)}</small></button></div>`);
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push(`<div class="kefine-vpn-guide__fallback"><strong>${escape_html(labels.resultTitle)}</strong> <p>The delivery package is ready for this order.</p></div>`);
			}
			$$renderer.push(`<!--]--></div></section>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> `);
		if (paymentStage === "result-ready" && selectedAuthMethod === "anonymous") {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<section class="kefine-anonymous-save kefine-anonymous-save--result"><p>${escape_html(resultLabels.anonymousSaveHint)}</p> <button type="button" data-variant="ghost" data-testid="kefine-save-result">${escape_html(buttons.saveResult)}</button></section>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></article>`);
	});
}
function mergeOrdersById(orders, order) {
	const index = orders.findIndex((item) => item.id === order.id);
	if (index === -1) return [order, ...orders];
	const current = orders[index];
	if (!current) return orders;
	return [
		...orders.slice(0, index),
		{
			...current,
			...order,
			id: current.id
		},
		...orders.slice(index + 1)
	];
}
function getVisibleOrdersLimit(ordersLength, currentLimit, pageSize) {
	if (ordersLength === 0) return pageSize;
	return Math.min(Math.max(currentLimit, 1), ordersLength);
}
function normalizeDraftOrder(form, localeText) {
	const sourceText = form.description.trim() || form.title.trim();
	const normalizedTitle = sourceText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0] || form.title.trim();
	const isVpnOrder = /(?:^|\s)(vpn)(?:$|\s)|телеграм|telegram/i.test(sourceText);
	const normalized = {
		title: normalizedTitle,
		description: sourceText,
		estimatedCost: form.estimatedCost.trim() || (isVpnOrder ? "2" : "0"),
		currency: form.currency.trim() || (isVpnOrder ? "USD" : localeText.defaults.defaultCurrency),
		executionEstimate: form.executionEstimate.trim(),
		files: [...form.files]
	};
	if (!normalized.title) normalized.title = localeText.defaults.taskTitle;
	return normalized;
}
function resolveWalletNetworkLabel(chainId, localeText) {
	if (chainId === 43114) return localeText.auth.walletNetworkAvalanche;
	if (chainId === 43113) return localeText.auth.walletNetworkAvalancheFuji;
	if (chainId === 100) return localeText.auth.walletNetworkGnosis;
	return localeText.auth.walletNetworkEthereum;
}
function createGeneratedWalletAvatar(address) {
	const normalizedAddress = address?.trim().toLowerCase();
	if (!normalizedAddress) return null;
	let hash = 0;
	for (let index = 0; index < normalizedAddress.length; index += 1) hash = hash * 31 + normalizedAddress.charCodeAt(index) >>> 0;
	const hueA = hash % 360;
	const hueB = (hash >>> 9) % 360;
	const hueC = (hash >>> 17) % 360;
	const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hueA} 72% 62%)" />
          <stop offset="100%" stop-color="hsl(${hueB} 68% 42%)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="20" fill="url(#g)" />
      <circle cx="20" cy="20" r="9" fill="hsl(${hueC} 78% 82% / 0.88)" />
      <circle cx="46" cy="22" r="6" fill="hsl(${hueA} 78% 88% / 0.82)" />
      <path d="M16 46c6-10 26-10 32 0" fill="none" stroke="hsl(${hueC} 88% 94%)" stroke-width="6" stroke-linecap="round" />
    </svg>
  `.trim();
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
async function fetchOrderStatus(args) {
	try {
		const response = await args.fetchFn(buildOrderProxyUrl(`/status/${encodeURIComponent(args.orderId)}`, args.orderApiBaseUrl), { headers: { Accept: "application/json" } });
		if (!response.ok) return null;
		return extractStatusPayload(await response.json(), args.fallbackOrder, args.localeText);
	} catch {
		return null;
	}
}
async function pollWorkspaceOrder(args) {
	let tries = 0;
	let latestOrder = args.order;
	while (tries < args.pollLimit) {
		if (args.signal.aborted) {
			args.deleteToken(args.order.id);
			return;
		}
		if (!args.isTokenCurrent(args.order.id, args.token)) return;
		const updated = await args.fetchOrderStatus(args.order.id, {
			title: latestOrder.title,
			description: latestOrder.description,
			currency: latestOrder.currency || args.localeText.defaults.defaultCurrency,
			createdAt: latestOrder.createdAt
		});
		if (!args.isTokenCurrent(args.order.id, args.token)) return;
		if (updated) {
			latestOrder = {
				...latestOrder,
				...updated,
				id: latestOrder.id
			};
			args.upsertOrder(latestOrder);
			const currentOrder = args.getCurrentOrder();
			if (currentOrder?.id === latestOrder.id) args.setCurrentOrder({
				...currentOrder,
				...updated,
				id: currentOrder.id
			});
			if (updated.status === "completed") {
				args.deleteToken(args.order.id);
				return;
			}
		}
		tries += 1;
		try {
			await args.waitForDelay(args.pollIntervalMs, args.signal);
		} catch {
			args.deleteToken(args.order.id);
			return;
		}
	}
	if (args.isTokenCurrent(args.order.id, args.token)) args.deleteToken(args.order.id);
}
async function submitWorkspaceOrder(args) {
	try {
		const requestPayload = buildCreatePayload(args.payload);
		const hasFiles = args.payload.files.length > 0;
		const requestBody = hasFiles ? (() => {
			const formData = new FormData();
			for (const [key, value] of Object.entries(requestPayload)) {
				if (value === void 0 || value === null) continue;
				if (Array.isArray(value) || typeof value === "object") {
					formData.append(key, JSON.stringify(value));
					continue;
				}
				formData.append(key, String(value));
			}
			for (const file of args.payload.files) formData.append("files", file, file.name);
			return formData;
		})() : JSON.stringify(requestPayload);
		const response = await args.fetchFn(buildOrderProxyUrl("/create", args.orderApiBaseUrl), {
			method: "POST",
			headers: {
				Accept: "application/json",
				...hasFiles ? {} : { "Content-Type": "application/json" }
			},
			body: requestBody
		});
		const responseBody = await response.json();
		const parsed = response.ok ? readCreateResponse(responseBody) : null;
		if (!response.ok || !parsed) throw new Error(args.localeText.errors.fallback);
		return {
			kind: "remote",
			order: {
				id: parsed.orderId,
				solver: parsed.solver || args.localeText.defaults.openSolverMarket,
				status: parsed.status || "queued",
				title: args.payload.title || args.localeText.defaults.taskTitle,
				description: args.payload.description || "",
				createdAt: (/* @__PURE__ */ new Date()).toISOString(),
				estimatedCost: args.toNumber(args.payload.estimatedCost) || void 0,
				currency: args.payload.currency || args.localeText.defaults.defaultCurrency,
				executionEstimate: args.resolveExecutionEstimate(args.payload.executionEstimate, args.payload.title, args.localeText),
				paymentUrl: void 0,
				uiScenario: parsed.uiScenario
			}
		};
	} catch {
		return { kind: "error" };
	}
}
//#endregion
//#region src/lib/components/kefine/KefineWorkspace.svelte
function KefineWorkspace($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let { initialOrderId } = $$props;
		const localeText = derived(() => getLocaleText(store_get($$store_subs ??= {}, "$kefineLocale", kefineLocale)));
		const runtimeConfig = derived(() => resolvePublicRuntimeConfig(page.data.publicConfig));
		function getNormalizedInitialOrderId() {
			return initialOrderId?.trim() || null;
		}
		let step = getNormalizedInitialOrderId() ? "executing" : "create";
		let draft = {
			title: "",
			description: "",
			estimatedCost: "",
			currency: "USD",
			executionEstimate: "",
			files: []
		};
		let currentOrder = getNormalizedInitialOrderId() ? {
			id: getNormalizedInitialOrderId(),
			solver: "",
			status: "queued",
			title: "",
			description: "",
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			currency: "USDC"
		} : null;
		let createdOrders = [];
		let leftNavExpanded = false;
		let isDarkTheme = false;
		let selectedAuthMethod = null;
		let paymentStage = "payment-method-select";
		let authDialogOpen = false;
		let contactDialogOpen = false;
		let passkeyDialogOpen = false;
		let stagePreviewOpen = false;
		let contactName = "";
		let contactEmail = "";
		let contactMessage = "";
		let isHydratingRoute = Boolean(getNormalizedInitialOrderId());
		const activePollTokens = /* @__PURE__ */ new Map();
		let pollAbortController = null;
		const passkeySession = derived(() => store_get($$store_subs ??= {}, "$passkeySessionStore", passkeySessionStore));
		const isPasskeyActive = derived(() => passkeySession() ? passkeySession().expiresAt.getTime() > Date.now() : false);
		const isAuthenticated = derived(() => authState.isConnected || isPasskeyActive());
		const walletNetworkLabel = derived(() => resolveWalletNetworkLabel(authState.chainId, localeText()));
		const walletAvatarUrl = derived(() => createGeneratedWalletAvatar(authState.address));
		const normalizedWalletLabel = derived(() => {
			const email = authState.email?.trim();
			if (email) return email;
			const address = authState.address?.trim();
			if (!address) return null;
			if (address.length <= 14) return address;
			return `${address.slice(0, 6)}...${address.slice(-4)}`;
		});
		const normalizedPasskeyLabel = derived(() => {
			const username = passkeySession()?.username?.trim();
			return username ? `@${username.replace(/^@+/, "")}` : null;
		});
		const authenticatedLabel = derived(() => {
			if (selectedAuthMethod === "passkey" && normalizedPasskeyLabel()) return normalizedPasskeyLabel();
			if (selectedAuthMethod === "wallet" && normalizedWalletLabel()) return normalizedWalletLabel();
			return normalizedPasskeyLabel() ?? normalizedWalletLabel();
		});
		const ORDER_PAGE_SIZE = 12;
		let visibleOrdersLimit = ORDER_PAGE_SIZE;
		const visibleOrders = derived(() => createdOrders.slice(0, visibleOrdersLimit));
		const hasMoreOrders = derived(() => visibleOrdersLimit < createdOrders.length);
		const topbarThemeActionLabel = derived(() => isDarkTheme ? localeText().topbar.theme.switchToLight : localeText().topbar.theme.switchToDark);
		const matchedOrders = derived(() => {
			const query = draft.description.trim().toLowerCase();
			if (!query) return [];
			return createdOrders.filter((order) => {
				if (order.status !== "completed") return false;
				return [
					order.id,
					order.title,
					order.solver,
					order.status
				].filter((value) => typeof value === "string").some((value) => value.toLowerCase().includes(query));
			});
		});
		const sidebarSocialLinks = derived(() => [
			{
				id: "mastodon",
				label: localeText().topbar.socialLinks.mastodon.label,
				href: runtimeConfig().app.socialLinks.mastodon,
				icon: "mdi:mastodon"
			},
			{
				id: "discord",
				label: localeText().topbar.socialLinks.discord.label,
				href: runtimeConfig().app.socialLinks.discord,
				icon: "mdi:discord"
			},
			{
				id: "linkedin",
				label: localeText().topbar.socialLinks.linkedin.label,
				href: runtimeConfig().app.socialLinks.linkedin,
				icon: "mdi:linkedin"
			},
			{
				id: "telegram",
				label: localeText().topbar.socialLinks.telegram.label,
				href: runtimeConfig().app.socialLinks.telegram,
				icon: "mdi:telegram"
			}
		]);
		const sidebarLegalLinks = derived(() => [
			{
				id: "privacy",
				label: localeText().topbar.legalLinks.privacy,
				href: "/privacy"
			},
			{
				id: "terms",
				label: localeText().topbar.legalLinks.terms,
				href: "/terms"
			},
			{
				id: "company",
				label: localeText().topbar.legalLinks.company,
				href: "/legal-information"
			}
		]);
		const remainingAmount = derived(() => currentOrder?.estimatedCost ?? 0);
		const executionPresentation = derived(() => deriveExecutionPresentation(currentOrder, localeText(), selectedAuthMethod, step === "payment"));
		const browserTitle = derived(() => {
			const title = currentOrder?.title?.trim();
			if (getNormalizedInitialOrderId() !== null || false) return title ? `${title} | Lefine` : "Loading task | Lefine";
			if ((step === "executing" || step === "payment") && title) return `${title} | Lefine`;
			return "Lefine - Automated Freelance Exchange";
		});
		const authDisplay = derived(() => ({
			appIconUrl: "/favicon.png",
			socialAvatarUrl: walletAvatarUrl(),
			passkeyAvatarUrl: null,
			actorAvatarUrl: null,
			activeMethod: selectedAuthMethod,
			walletLabel: normalizedWalletLabel(),
			passkeyLabel: normalizedPasskeyLabel()
		}));
		const TITLE_FONT_MAX = 2;
		const TITLE_FONT_MIN = 1;
		const TITLE_FONT_SHRINK_AT = 24;
		const TITLE_FONT_SHRINK_STEP = 20;
		const titleFontSize = derived(() => Math.max(TITLE_FONT_MIN, TITLE_FONT_MAX - Math.max(0, (draft.description.length - TITLE_FONT_SHRINK_AT) / TITLE_FONT_SHRINK_STEP)));
		function resetTransactionState() {
			selectedAuthMethod = null;
			paymentStage = "payment-method-select";
			stagePreviewOpen = false;
		}
		function handleTopbarBrandClick() {
			leftNavExpanded = false;
			newOrder();
		}
		function openContactEmailDraft() {}
		async function selectTopbarAuth() {
			if (!isAuthenticated()) {
				authDialogOpen = true;
				return;
			}
			try {
				await disconnectAppKit();
			} catch {}
			clearAuthState();
			selectedAuthMethod = null;
			authDialogOpen = false;
			passkeyDialogOpen = false;
		}
		function selectTopbarLocale(locale) {
			setKefineLocale(locale);
		}
		function upsertOrder(order) {
			createdOrders = mergeOrdersById(createdOrders, order);
			visibleOrdersLimit = getVisibleOrdersLimit(createdOrders.length, visibleOrdersLimit, ORDER_PAGE_SIZE);
		}
		function stopOrder(order) {
			activePollTokens.delete(order.id);
			upsertOrder({
				...order,
				status: "stopped"
			});
			if (currentOrder?.id === order.id) currentOrder = {
				...currentOrder,
				status: "stopped"
			};
		}
		function showOrderFlow(order, preferredView = null) {
			currentOrder = order;
			resetTransactionState();
			if (order.status === "completed") {
				if (preferredView === "stages") {
					stagePreviewOpen = true;
					step = "executing";
					return;
				}
				paymentStage = "result-ready";
				step = "payment";
				return;
			}
			step = "executing";
		}
		function openOrder(order) {
			showOrderFlow(order);
		}
		function loadMoreOrders() {
			if (!hasMoreOrders()) return;
			visibleOrdersLimit = Math.min(visibleOrdersLimit + ORDER_PAGE_SIZE, createdOrders.length);
		}
		function orderApiBaseUrl() {
			return resolveOrderProxyBasePath("");
		}
		function craterBaseUrl() {
			return "";
		}
		async function requestOrderFromStatus(orderId, fallbackOrder) {
			return fetchOrderStatus({
				orderId,
				fallbackOrder,
				localeText: localeText(),
				fetchFn: fetch,
				orderApiBaseUrl: orderApiBaseUrl()
			});
		}
		function startOrderPolling(order) {
			if (!pollAbortController || pollAbortController.signal.aborted) pollAbortController = new AbortController();
			const token = Symbol(order.id);
			activePollTokens.set(order.id, token);
			pollOrderInBackground(order, token, pollAbortController.signal);
		}
		async function pollOrderInBackground(order, token, signal) {
			await pollWorkspaceOrder({
				order,
				token,
				signal,
				pollLimit: 30,
				pollIntervalMs: POLL_INTERVAL_MS,
				localeText: localeText(),
				fetchOrderStatus: requestOrderFromStatus,
				isTokenCurrent: (orderId, currentToken) => activePollTokens.get(orderId) === currentToken,
				deleteToken: (orderId) => {
					activePollTokens.delete(orderId);
				},
				upsertOrder,
				getCurrentOrder: () => currentOrder,
				setCurrentOrder: (orderValue) => {
					currentOrder = orderValue;
				},
				waitForDelay
			});
		}
		async function createOrder(payload, options) {
			const isBackground = options?.background === true;
			if (!isBackground) step = "submitting";
			const result = await submitWorkspaceOrder({
				payload,
				isBackground,
				localeText: localeText(),
				fetchFn: fetch,
				orderApiBaseUrl: orderApiBaseUrl(),
				toNumber,
				resolveExecutionEstimate
			});
			if (result.kind === "error") {
				if (!isBackground) step = "create";
				return false;
			}
			upsertOrder(result.order);
			startOrderPolling(result.order);
			if (!isBackground) {
				currentOrder = result.order;
				resetTransactionState();
				step = "executing";
			}
			return true;
		}
		async function submitDraft(form, options) {
			if (await createOrder(normalizeDraftOrder(form, localeText()), options) && options?.background) draft = {
				title: "",
				description: "",
				estimatedCost: "",
				currency: "USD",
				executionEstimate: "",
				files: []
			};
		}
		function handleSubmit() {
			submitDraft(draft);
		}
		async function queueTaskBelow() {
			if (!draft.description.trim()) return;
			await submitDraft(draft, { background: true });
		}
		function attachFiles(files) {
			draft.files = [...draft.files, ...Array.from(files)];
		}
		function removeAttachedFile(index) {
			draft.files = draft.files.filter((_, fileIndex) => fileIndex !== index);
		}
		function handleStopOrder(order, event) {
			event.preventDefault();
			event.stopPropagation();
			stopOrder(order);
		}
		function newOrder() {
			draft = {
				title: "",
				description: "",
				estimatedCost: "",
				currency: "USD",
				executionEstimate: "",
				files: []
			};
			currentOrder = null;
			resetTransactionState();
			step = "create";
		}
		head("ho2956", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>${escape_html(browserTitle())}</title>`);
			});
		});
		$$renderer.push(`<main class="kefine-shell">`);
		KefineTopbar($$renderer, {
			brandLabel: localeText().brand.name,
			navigationLabel: localeText().topbar.quickActions,
			openSidebarLabel: localeText().topbar.openActionsMenu,
			collapseSidebarLabel: localeText().topbar.closeActionsMenu,
			dockLabel: localeText().topbar.dockLabel,
			socialLabel: localeText().topbar.socialLabel,
			legalLabel: localeText().topbar.legalLabel,
			mailLabel: localeText().topbar.mailLabel,
			githubLabel: localeText().topbar.githubLabel,
			githubUrl: runtimeConfig().app.githubUrl,
			themeLabel: topbarThemeActionLabel(),
			signInLabel: localeText().topbar.signIn,
			signedInLabel: localeText().topbar.signedIn,
			authenticatedLabel: authenticatedLabel(),
			authenticatedSecondaryLabel: authState.isConnected ? walletNetworkLabel() : null,
			authenticatedAvatarUrl: authState.isConnected ? walletAvatarUrl() : null,
			isAuthenticated: isAuthenticated(),
			isDarkTheme,
			isExpanded: leftNavExpanded,
			locale: store_get($$store_subs ??= {}, "$kefineLocale", kefineLocale),
			languageEnglishLabel: localeText().topbar.languageEnglish,
			languageRussianLabel: localeText().topbar.languageRussian,
			languageArmenianLabel: localeText().topbar.languageArmenian,
			socialLinks: sidebarSocialLinks(),
			legalLinks: sidebarLegalLinks(),
			onToggleExpand: () => {
				leftNavExpanded = !leftNavExpanded;
			},
			onBrandClick: handleTopbarBrandClick,
			onOpenEmailDraft: openContactEmailDraft,
			onOpenEmailDialog: () => {
				contactDialogOpen = true;
			},
			onTheme: () => {
				isDarkTheme = !isDarkTheme;
			},
			onAuth: selectTopbarAuth,
			onLocale: selectTopbarLocale
		});
		$$renderer.push(`<!----> <section${attr_class("kefine-layout", void 0, {
			"kefine-layout--create": step === "create",
			"kefine-layout--flow": step === "executing" || step === "payment" || step === "submitting"
		})}>`);
		if (step === "create") {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<kefine-screen class="kefine-screen">`);
			KefineCreateStep($$renderer, {
				draft,
				title: localeText().create.title,
				subtitle: localeText().create.subtitle,
				afe: {
					title: localeText().afe.title,
					cards: [
						localeText().afe.cards.afe,
						localeText().afe.cards.task,
						localeText().afe.cards.quote,
						localeText().afe.cards.delivery
					]
				},
				titleFontSize: titleFontSize(),
				placeholder: localeText().create.placeholder,
				placeholderVariants: localeText().create.placeholderVariants,
				executeAria: localeText().create.executeAria,
				backgroundExecuteAria: localeText().create.backgroundExecuteAria,
				solverLabel: localeText().labels.solver,
				recentOrders: visibleOrders(),
				matchedOrders: matchedOrders(),
				isSearching: draft.description.trim().length > 0,
				totalOrders: createdOrders.length,
				hasMoreOrders: hasMoreOrders(),
				onLoadMoreOrders: loadMoreOrders,
				matchedTasksLabel: localeText().create.matchedTasks,
				addFileLabel: localeText().create.addFile,
				addPriceLabel: localeText().create.addPrice,
				fileCountLabel: localeText().create.fileCount,
				composerHints: localeText().create.composerHints,
				timeLeftLabel: localeText().labels.timeLeft,
				priceLabel: localeText().labels.price,
				statusLabel: localeText().labels.taskStatus,
				stopTaskLabel: localeText().buttons.stopTask,
				onSubmit: handleSubmit,
				onQueueTask: queueTaskBelow,
				onAttachFiles: attachFiles,
				onRemoveFile: removeAttachedFile,
				onStopOrder: handleStopOrder,
				onOpenOrder: openOrder
			});
			$$renderer.push(`<!----></kefine-screen>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> `);
		if (step === "submitting") {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<kefine-screen class="kefine-screen">`);
			KefineSubmittingStep($$renderer);
			$$renderer.push(`<!----></kefine-screen>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> `);
		if (step === "executing") {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<kefine-screen class="kefine-screen">`);
			KefineExecutingStep($$renderer, {
				currentOrder,
				execution: executionPresentation(),
				isHydratingTitle: isHydratingRoute && !currentOrder?.title.trim(),
				forceFinalVpnStep: stagePreviewOpen,
				authDisplay: authDisplay(),
				walletNetworkLabel: walletNetworkLabel(),
				labels: {
					solver: localeText().labels.solver,
					subtasks: localeText().labels.subtasks,
					chooseMethod: localeText().labels.chooseMethod,
					cancel: localeText().buttons.cancel,
					timeLeft: localeText().labels.timeLeft,
					price: localeText().labels.price
				},
				authLabels: {
					walletTitle: localeText().auth.walletTitle,
					passkeyTitle: localeText().auth.passkeyTitle,
					anonymousTitle: localeText().auth.anonymousTitle,
					anonymousDetail: localeText().auth.anonymousDetail,
					walletAccount: localeText().auth.walletAccount
				}
			});
			$$renderer.push(`<!----></kefine-screen>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--> `);
		if (step === "payment") {
			$$renderer.push("<!--[-->");
			$$renderer.push(`<kefine-screen class="kefine-screen">`);
			KefinePaymentStep($$renderer, {
				currentOrder,
				remainingAmount: remainingAmount(),
				paymentInvoiceFallback: `${craterBaseUrl()}/pay/${currentOrder?.id ?? ""}`,
				selectedAuthMethod,
				paymentStage,
				isAuthenticated: isAuthenticated(),
				labels: {
					taskId: localeText().labels.taskId,
					amount: localeText().labels.amount,
					executionEstimate: localeText().labels.executionEstimate,
					paymentInvoice: localeText().labels.paymentInvoice,
					createNewTask: localeText().buttons.createNewTask,
					selectedMethod: localeText().labels.selectedMethod,
					remainingBalance: localeText().labels.remainingBalance,
					resultTitle: localeText().labels.resultTitle
				},
				paymentLabels: {
					summaryTitle: localeText().payment.summaryTitle,
					methodSelectTitle: localeText().payment.methodSelectTitle,
					walletReadyTitle: localeText().payment.walletReadyTitle,
					passkeyReadyTitle: localeText().payment.passkeyReadyTitle,
					anonymousReadyTitle: localeText().payment.anonymousReadyTitle,
					promoHint: localeText().payment.promoHint,
					promoCodeLabel: localeText().labels.promoCode,
					promoCodePlaceholder: localeText().placeholders.promoCode,
					promoEmpty: localeText().errors.promoEmpty,
					promoOk: localeText().errors.promoOk,
					promoWrong: localeText().errors.promoWrong,
					depositDialogTitle: localeText().payment.depositDialogTitle,
					depositDialogDetail: localeText().payment.depositDialogDetail,
					depositPendingTitle: localeText().payment.depositPendingTitle,
					depositPendingDetail: localeText().payment.depositPendingDetail,
					paidTitle: localeText().payment.paidTitle,
					paidDetail: localeText().payment.paidDetail,
					linkedWalletHint: localeText().payment.linkedWalletHint,
					payCtaHint: localeText().payment.payCtaHint
				},
				resultLabels: { anonymousSaveHint: localeText().result.anonymousSaveHint },
				authLabels: {
					walletTitle: localeText().auth.walletTitle,
					walletAccount: localeText().auth.walletAccount,
					passkeyTitle: localeText().auth.passkeyTitle,
					anonymousTitle: localeText().auth.anonymousTitle,
					anonymousDetail: localeText().auth.anonymousDetail
				},
				authDisplay: authDisplay(),
				buttons: {
					apply: localeText().buttons.apply,
					payNow: localeText().buttons.payNow,
					confirmLinkedWallet: localeText().buttons.confirmLinkedWallet,
					depositNow: localeText().buttons.depositNow,
					payWithPromo: localeText().buttons.payWithPromo,
					openResult: localeText().buttons.openResult,
					rejectResult: localeText().buttons.rejectResult,
					openAllTasks: localeText().buttons.openAllTasks,
					saveResult: localeText().buttons.saveResult,
					closeDialog: localeText().buttons.closeDialog
				}
			});
			$$renderer.push(`<!----></kefine-screen>`);
		} else $$renderer.push("<!--[!-->");
		$$renderer.push(`<!--]--></section> `);
		KefineAuthDialog($$renderer, {
			open: authDialogOpen,
			title: localeText().executionFlow["awaiting-auth"].title,
			description: localeText().executionFlow["awaiting-auth"].detail,
			walletTitle: localeText().auth.walletTitle,
			passkeyTitle: localeText().auth.passkeyTitle,
			localhostTitle: localeText().auth.localhostTitle,
			closeLabel: localeText().buttons.closeDialog,
			onClose: () => {
				authDialogOpen = false;
			}});
		$$renderer.push(`<!----> `);
		KefinePasskeyDialog($$renderer, {
			open: passkeyDialogOpen,
			title: localeText().auth.passkeyTitle,
			onClose: () => {
				passkeyDialogOpen = false;
			}});
		$$renderer.push(`<!----> `);
		KefineContactDialog($$renderer, {
			open: contactDialogOpen,
			title: localeText().contact.title,
			description: localeText().contact.description,
			nameLabel: localeText().contact.nameLabel,
			emailLabel: localeText().contact.emailLabel,
			messageLabel: localeText().contact.messageLabel,
			nameValue: contactName,
			emailValue: contactEmail,
			messageValue: contactMessage,
			namePlaceholder: localeText().placeholders.contactName,
			emailPlaceholder: localeText().placeholders.contactEmail,
			messagePlaceholder: localeText().placeholders.contactMessage,
			submitLabel: localeText().buttons.sendMessage,
			closeLabel: localeText().buttons.closeDialog,
			onClose: () => {
				contactDialogOpen = false;
			}});
		$$renderer.push(`<!----></main>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { KefineWorkspace as K };
//# sourceMappingURL=KefineWorkspace-Cpq922tZ.js.map
