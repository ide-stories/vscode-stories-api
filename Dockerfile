FROM node:12
WORKDIR /usr/src/app
COPY . .
RUN yarn
EXPOSE 8080 
ENV NODE_ENV=production
CMD [ "yarn", "dev" ]