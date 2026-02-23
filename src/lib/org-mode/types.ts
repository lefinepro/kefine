// Org Mode type definitions for parsing .org files

export type OrgNodeType =
	| 'org-data'
	| 'headline'
	| 'section'
	| 'paragraph'
	| 'text'
	| 'keyword'
	| 'property-drawer'
	| 'property';

export interface OrgNode {
	type: OrgNodeType;
}

export interface OrgHeadline extends OrgNode {
	type: 'headline';
	level: number;
	title: OrgNode[];
	tags?: string[];
	todo?: string;
	children?: OrgNode[];
}

export interface OrgProperty extends OrgNode {
	type: 'property';
	key: string;
	value: string;
}

export interface OrgPropertyDrawer extends OrgNode {
	type: 'property-drawer';
	children: OrgProperty[];
}

export interface OrgFile {
	type: 'org-data';
	children: OrgNode[];
	keywords?: Record<string, string>;
}

// Type guards

export function isOrgHeadline(node: OrgNode): node is OrgHeadline {
	return node.type === 'headline';
}

export function isOrgProperty(node: OrgNode): node is OrgProperty {
	return node.type === 'property';
}

export function isOrgPropertyDrawer(node: OrgNode): node is OrgPropertyDrawer {
	return node.type === 'property-drawer';
}

export function isOrgFile(node: OrgNode): node is OrgFile {
	return node.type === 'org-data';
}
