# build stage
FROM node:13 as build-stage

RUN apt update \
    && apt install -y ruby ruby-dev \
    && gem install compass \
    && npm install -g grunt bower

WORKDIR /app
COPY .bowerrc .gitignore .jshintrc bower.json docco.css Gruntfile.js package.json readme.md ./
COPY app/ ./app/

RUN npm install \
    && bower install --allow-root \
    && grunt build \
    && cd dist \
    && sed -i -e 's|http://localhost:9000/vires00/ows|/ows|' scripts/config.json \
    && sed -i -e 's|\"debug\": true,|\"debug\": false,|' scripts/config.json

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
