// Simple MIME message builder for Cloudflare Workers
// Replaces mimetext to avoid node:os dependency

interface MimeMessageOptions {
	from: string;
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
	attachments?: Array<{
		filename: string;
		content: string; // base64
		type: string;
		disposition?: "attachment" | "inline";
		contentId?: string;
	}>;
	inReplyTo?: string;
	references?: string[];
}

export function buildMimeMessage(options: MimeMessageOptions): string {
	const { from, to, subject, text, html, attachments, inReplyTo, references } = options;
	
	const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
	const altBoundary = `----=_Alt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
	
	// Convert to to string if it's an array
	const toStr = Array.isArray(to) ? to.join(", ") : to;
	
	let mime = "";
	
	// Headers
	mime += `From: ${from}\r\n`;
	mime += `To: ${toStr}\r\n`;
	mime += `Subject: ${subject}\r\n`;
	mime += `MIME-Version: 1.0\r\n`;
	mime += `Date: ${new Date().toUTCString()}\r\n`;
	mime += `Message-ID: <${crypto.randomUUID()}@cloudflare.workers.dev>\r\n`;
	
	// Threading headers
	if (inReplyTo) {
		mime += `In-Reply-To: <${inReplyTo}>\r\n`;
	}
	if (references && references.length > 0) {
		const refs = references.map(ref => `<${ref}>`).join(' ');
		mime += `References: ${refs}\r\n`;
	}
	
	// Content-Type
	if (attachments && attachments.length > 0) {
		mime += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
		mime += `This is a multi-part message in MIME format.\r\n\r\n`;
		mime += `--${boundary}\r\n`;
	}
	
	// Body content
	if (text && html) {
		// Multipart alternative for text and HTML
		mime += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n\r\n`;
		
		// Text version
		mime += `--${altBoundary}\r\n`;
		mime += `Content-Type: text/plain; charset=utf-8\r\n`;
		mime += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
		mime += `${text}\r\n\r\n`;
		
		// HTML version
		mime += `--${altBoundary}\r\n`;
		mime += `Content-Type: text/html; charset=utf-8\r\n`;
		mime += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
		mime += `${html}\r\n\r\n`;
		
		mime += `--${altBoundary}--\r\n`;
	} else if (html) {
		mime += `Content-Type: text/html; charset=utf-8\r\n`;
		mime += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
		mime += `${html}\r\n`;
	} else if (text) {
		mime += `Content-Type: text/plain; charset=utf-8\r\n`;
		mime += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
		mime += `${text}\r\n`;
	}
	
	// Attachments
	if (attachments && attachments.length > 0) {
		for (const att of attachments) {
			mime += `\r\n--${boundary}\r\n`;
			mime += `Content-Type: ${att.type}; name="${att.filename}"\r\n`;
			mime += `Content-Transfer-Encoding: base64\r\n`;
			
			if (att.disposition === "inline" && att.contentId) {
				mime += `Content-Disposition: inline; filename="${att.filename}"\r\n`;
				mime += `Content-ID: <${att.contentId}>\r\n\r\n`;
			} else {
				mime += `Content-Disposition: attachment; filename="${att.filename}"\r\n\r\n`;
			}
			
			// Split base64 content into 76-character lines (RFC 2045)
			const content = att.content;
			for (let i = 0; i < content.length; i += 76) {
				mime += content.substring(i, i + 76) + "\r\n";
			}
		}
		
		mime += `\r\n--${boundary}--\r\n`;
	}
	
	return mime;
}
