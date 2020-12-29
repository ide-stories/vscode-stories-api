# vscode-stories-api

https://github.com/ide-stories/vscode-stories

# How to run with docker (recommended, requires docker & docker-compose)
1. Make sure you have no services running on ports 5050, 8080 and 5432 (e.g. with `netstat -tulpn | grep LISTEN`).
   If necessary, you can change the *ports* section of each service in the *docker-compose.yml*.
2. Set the `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` variables in *docker-compose.yml*.
3. Run `docker-compose up -d` from the project root
4. Your stack is now running partially. Open pgAdmin on *localhost:5050* with the default credentials (*pgadmin4@gpadmin.org|admin*) 
   and create a server with host 'postgres_container', 
   username 'postgres', password 'changeme'. Create a database called *stories*.
5. Restart the api service with `docker-compose restart api`
6. Check with `docker-compose logs api` if the server is running. It should say *server started*

# How to run on your computer (native)
1. Have PostgreSQL running on your computer
2. Create a database called `stories`
3. Copy `.env.example` to `.env` and fill in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (you will have to register a GitHub OAuth account and set the callback url to: http://localhost:8080/auth/github/callback)
4. Fill in database credentials to `.env` ([typeorm docs options](https://typeorm.io/#/connection-options/postgres--cockroachdb-connection-options))
5. Don't forget to run `yarn`
6. `yarn dev` to startup server
