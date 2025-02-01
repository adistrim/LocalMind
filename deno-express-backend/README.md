# Setup Guide

Make sure you have Deno installed on your system. If not, you can install it from [deno.land](https://deno.land/).

`.env` file should be created in the root directory of the backend with the following content:
```env
MONGO_INITDB_ROOT_USERNAME=---username---
MONGO_INITDB_ROOT_PASSWORD=---password---
DATABASE_URL=---mongodb-url---
PORT=---port---
```

### Database
Make sure you have `Docker` installed on your system. If not, you can install it from [docker.com](https://www.docker.com/).

Run the following command to start the MongoDB container:
```bash
docker-compose up -d
```

### Server Start command
```bash
deno run --allow-read --allow-env --allow-net --allow-sys src/main.ts
```
