# ap-backend

Express + Sequelize (PostgreSQL) backend for Asia Pharm — auth, admin, product catalog, orders, billing, wishlist, and analytics.

## Tech stack

- Node.js / Express 4
- Sequelize 6 (PostgreSQL via `pg`)
- JWT auth (`jsonwebtoken`, `bcrypt`)
- AWS S3 for file uploads (`aws-sdk`, `multer-s3`)
- Nodemailer for outbound email

## Project structure

```
app.js              Express app entry point
routes/              Route definitions (admin, auth, user, product, order, billing, wishlist, category, analytics)
controllers/         Route handlers
models/              Sequelize models used by sequelize-cli (migrations/seeders)
productModels/       Sequelize models for the storefront domain (products, orders, billing, etc.)
database/            Sequelize connection setup
migrations/          Sequelize-cli migrations
seeders/             Sequelize-cli seeders
utils/               Auth, mail, and validation helpers
aws/                 S3 upload helper
config/config.json   sequelize-cli DB config (development/staging/production)
```

## Prerequisites

- Node.js 16
- A PostgreSQL 13 database
- A `.env` file in the project root (see below)

## Environment variables

Create a `.env` file in the project root:

```
DB_USERNAME=
DB_PASSWORD=
DB_HOST=
DB_PORT=5432
DB_NAME=

JWT_SECRET_KEY=
CAPTCHA_KEY=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_ADDR=
EMAIL_PWD=
EMAIL_CLIENTID=
EMAIL_CLIENT_SECRET=
REDIRECT_URL=
REFRESH_TOKEN=
```

`database/connection.js` currently connects with `ssl.require: true`, so `DB_HOST` needs to point at a Postgres instance that accepts SSL connections (e.g. RDS) unless that's changed for local/Docker use.

For `sequelize-cli` (migrations/seeders), edit `config/config.json` directly — it doesn't read `.env`.

## Running locally

```bash
npm install
npm start          # nodemon app.js, http://localhost:8000
```

Run migrations / seeders against the environment configured in `config/config.json`:

```bash
npm run migration   # sequelize-cli db:migrate
npm run seed         # sequelize-cli db:seed:all
```

## Running with Docker

`docker-compose.yml` runs three services: the app, a local Postgres 13 database, and a Caddy reverse proxy that terminates TLS for `api.asiapharmsg.com` (auto-provisions a Let's Encrypt certificate — requires DNS for that domain to point at the host and ports 80/443 to be open).

```bash
docker compose up --build
```

- App container reads DB credentials from the compose file (pointed at the `db` service) plus the rest of `.env` for JWT/email/captcha settings.
- Postgres data persists in the `ap_psql_data` volume.
- Caddy config lives in `caddy/Caddyfile`.

To run against a remote database (e.g. RDS) instead of the bundled Postgres container, drop the `db` service and point `DB_HOST` in `.env` at it.
