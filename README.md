# vscode-stories-api

https://github.com/benawad/vscode-stories

# How to run on your computer

1. Have PostgreSQL running on your computer
2. Create a database called `stories`
3. Copy `.env.example` to `.env` and fill in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (you will have to register a GitHub OAuth account and set the callback url to: http://localhost:8080/auth/github/callback)
4. Don't forget to run `yarn`
5. `yarn dev` to startup server
