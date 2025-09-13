export interface Mailbox {
	id: string;
	email: string;
	name: string;
	settings?: any;
}

export interface Email {
	id: string;
	subject: string;
	sender: string;
	recipient: string;
	date: string;
	read: boolean;
	starred: boolean;
	body?: string | null;
	attachments?: Attachment[];
}

export interface Attachment {
	id: string;
	filename: string;
	mimetype: string;
	size: number;
	content_id?: string;
	disposition?: string;
}

export interface Folder {
	id: string;
	name: string;
	unreadCount: number;
}

export interface Contact {
	id: string;
	name: string;
	email: string;
}
