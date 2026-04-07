FROM node:20 AS fe-build

WORKDIR /app

COPY fe/package*.json ./fe/
RUN cd fe && npm install

COPY fe ./fe
RUN cd fe && npm run build

FROM node:20

WORKDIR /app

COPY be/package*.json ./
RUN npm install

COPY be .

COPY --from=fe-build /app/fe/dist ./dist

EXPOSE 3300

CMD ["npm", "start"]