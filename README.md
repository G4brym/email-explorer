<div align="center">
  <a href="#">
    <h1 style="font-size: 4rem;">📧</h1>
    <h1>Email Explorer</h1>
  </a>
</div>

<p align="center">
    <em>A self-hosted, serverless worker for sending and receiving emails on Cloudflare</em>
</p>

<p align="center">
    <a href="https://github.com/G4brym/email-explorer/commits/main" target="_blank">
      <img src="https://img.shields.io/github/commit-activity/m/G4brym/email-explorer?label=Commits&style=social" alt="Email Explorer Commits">
    </a>
    <a href="https://github.com/G4brym/email-explorer/issues" target="_blank">
      <img src="https://img.shields.io/github/issues/G4brym/email-explorer?style=social" alt="Issues">
    </a>
    <a href="https://github.com/G4brym/email-explorer/blob/main/LICENSE" target="_blank">
      <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=social" alt="Software License">
    </a>
</p>

# Email Explorer

Email Explorer is a full-stack, serverless email client that runs entirely on your own Cloudflare account. It provides a modern, fast, and secure way to manage your emails using Cloudflare's powerful infrastructure, including Workers, R2, Durable Objects, Email Routing, and Email Sending.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/G4brym/email-explorer/tree/main/template)

## Overview

Email Explorer gives you a private, self-hosted email solution with a user-friendly web interface. By leveraging the Cloudflare ecosystem, it offers a cost-effective and scalable alternative to traditional email hosting. All your data is stored securely in your own R2 buckets and Durable Objects, giving you full control over your information.

When you first load your worker, there will be no mailbox, they will be automatically created when you start receiving emails on your worker.

```
Please note that for sending emails, you will need to have you Cloudflare account with Email sending enabled!
```

## Key Features

- **🔒 Secure & Private**: Self-hosted on your Cloudflare account. No third-party tracking or data scanning.
- **✉️ Email Management**: Send, receive, and organize emails with a clean and intuitive interface.
- **📁 Folder Organization**: Create custom folders to organize your emails.
- **📎 Attachment Support**: View and download attachments directly in the browser.
- **⚡ Serverless Architecture**: Each mailbox is its own durable object.

## Getting Started

To deploy Email Explorer, you can use the "Deploy to Cloudflare" button above or run this command:

```bash
npm create cloudflare@latest -- --template=https://github.com/G4brym/email-explorer/tree/main/template
```

## Roadmap

We are actively working on improving Email Explorer with these features:

- **Rich Text Editor**: A full-featured editor for composing emails.

## Known Issues

- This is a work in progress, and some features might not be fully stable.
- Please report any issues you find on our [GitHub Issues](https://github.com/G4brym/email-explorer/issues) page.

## Contributing

Contributions are welcome! If you have a feature request, bug report, or want to contribute to the code, please feel free to:

1.  Fork the repository.
2.  Create a new branch for your feature or fix.
3.  Submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
