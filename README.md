# Hosting JavaScript Files on a CDN (jsDelivr / unpkg)

This guide explains how to host your JavaScript file on a free CDN using GitHub and jsDelivr or unpkg.

Option 1: Use jsDelivr (Recommended)

jsDelivr automatically serves files from any public GitHub repository — no extra configuration needed.

Steps:

Create a GitHub Repository

Go to https://github.com/new

Name it (e.g., my-widget)

Set it to Public

Click Create Repository

Upload your JS file

Upload your file (e.g., widget.js) into the repository.

Commit the file to the main branch.

Get the CDN URL
Replace yourusername and reponame in this template:
https://cdn.jsdelivr.net/gh/yourusername/reponame@main/filename.js

Example:
https://cdn.jsdelivr.net/gh/mackydev/my-widget@main/widget.js

Use it in your website
Add the script tag to your HTML:

<script src="https://cdn.jsdelivr.net/gh/mackydev/my-widget@main/widget.js"></script>

(Optional) Versioning
To use a specific commit or version tag:
https://cdn.jsdelivr.net/gh/yourusername/reponame@v1.0.0/widget.js

Option 2: Use unpkg (Alternative)

unpkg also fetches files directly from GitHub or npm.

Same as above — upload your file to a public GitHub repo.
Use this link format:
https://unpkg.com/yourusername/reponame@main/filename.js

Example:
https://unpkg.com/mackydev/my-widget@main/widget.js

Tips:

Cache control: jsDelivr caches files globally; changes may take a few minutes to update.

File updates: just push to GitHub — no manual upload needed.

Private repos: jsDelivr and unpkg work only with public repositories.

Example:

Repository:
https://github.com/mackydev/my-widget

CDN URL:
https://cdn.jsdelivr.net/gh/mackydev/my-widget@main/widget.js

Usage:

<script src="https://cdn.jsdelivr.net/gh/mackydev/my-widget@main/widget.js"></script>
