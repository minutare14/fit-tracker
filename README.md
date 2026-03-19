This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Docker Deploy Without Port Collisions

The app no longer assumes host port `3000` is free.

1. Audit the host and choose a free port automatically:

```bash
./scripts/deploy/select_port.sh
```

2. Build and start the stack with the selected port:

```bash
./scripts/deploy/up.sh
```

The script inspects the real host with `ss`, `netstat`, or `lsof`, writes `.deploy.env`, and starts Docker Compose with a free `APP_HOST_PORT`.

Useful commands:

```bash
docker compose --env-file .env --env-file .deploy.env ps
docker compose --env-file .env --env-file .deploy.env logs -f app
curl http://127.0.0.1:$(grep APP_HOST_PORT .deploy.env | cut -d= -f2)
```
