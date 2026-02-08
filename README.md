Video Greeting App is a Next.js application that lets users create AI-generated
video greetings. Users pick an occasion, choose a video model, upload/select an
avatar, write a message, then generate a video using FAL.ai.

## Features

- Multi-step creation flow with model selection
- FAL.ai video generation with text-to-video and image-to-video models
- Credit-based generation with Stripe checkout
- Status polling and permanent storage of generated videos

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended)
- PostgreSQL database (e.g., Neon)

### Environment variables

Create a `.env.local` file with:

```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
FAL_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Install dependencies

```bash
pnpm install
```

### Set up the database

```bash
pnpm prisma db push
pnpm prisma generate
```

### Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Open [http://localhost:3000](http://localhost:3000) to use the app.

## FAL.ai models

The app supports multiple FAL.ai video models. Model choice is stored per video
and used for both generation and status polling.

- `fal-ai/veo2` (text-to-video)
- `fal-ai/veo3.1/fast/image-to-video` (image-to-video, fast)
- `fal-ai/veo3.1/reference-to-video` (best quality, reference images, 1080p, audio)

To add or update models, edit `src/lib/fal.ts` and `src/components/ModelPicker.tsx`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
