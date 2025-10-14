# Hosting JavaScript Files on a CDN (jsDelivr / unpkg)

## This guide explains how to host your JavaScript file on a free CDN using GitHub and jsDelivr or unpkg. jsDelivr automatically serves files from any public GitHub repository — no extra configuration needed.

### Steps:

1. Create a GitHub Repository

2. Go to https://github.com/new

3. Name it (e.g., my-widget)

4. Set it to Public

5. Click Create Repository

6. Upload your JS file

7. Upload your file (e.g., widget.js and the css of the chat widget ui.css) into the repository.
8. Commit the file to the main branch.

9. Get the CDN URL
Replace yourusername and reponame in this template:
### https://cdn.jsdelivr.net/gh/yourusername/reponame@main/filename.js

### Example:
https://cdn.jsdelivr.net/gh/sample123/my-widget@main/widget.js

### Use it in your website
### Add the script tag to your HTML:
- <script src="https://cdn.jsdelivr.net/gh/(github username)/(repository name)@main/widget.js"></script>
- <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/(github username)/Sample-CDN@master/chat_widget.css"> // For CSS
