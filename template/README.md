# My Personal Email Explorer

This is my personal [Email Explorer](https://github.com/G4brym/email-explorer) application, self-hosted on my Cloudflare account.

## Getting Started

1.  **Sign up for Cloudflare:**
    If you don't have an account yet, sign up for [Cloudflare](https://www.cloudflare.com/). The free tier is very generous and should be sufficient for personal use.

2.  **Clone this repository:**
    Clone this project to your local machine.

3.  **Install dependencies:**
    Install the necessary dependencies for the worker and the dashboard.
    ```bash
    npm install
    ```

4.  **Login to Wrangler:**
    Login to your Cloudflare account using the Wrangler CLI.
    ```bash
    npx wrangler login
    ```

5.  **Deploy:**
    ```bash
    npx wrangler deploy
    ```

Once deployed, you can set up Cloudflare Email Routing to forward your emails to your new serverless email client.

## Updating Your Instance

To update your Email Explorer instance to the latest version, pull the latest changes from the main repository and redeploy:

```bash
npm install email-explorer@latest --save
npx wrangler deploy
```
