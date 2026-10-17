# Listify AI

**Turn products into powerful listings.**

Listify AI is a lightweight AI-powered web application that helps
small businesses, freelancers, and independent sellers create
professional product listings in seconds.

Built with HTML, CSS, vanilla JavaScript, and open-weight
AI models accessed through OpenRouter.

## Features

- AI-generated product titles
- Professional product descriptions
- Relevant hashtags
- Call-to-action generation
- Multiple writing tones
- Platform-specific content
- English and Spanish support
- Copy-to-clipboard functionality
- Responsive premium interface
- Smooth scroll animations

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Vercel Serverless Functions
- OpenRouter API
- Open-weight language models

## Getting Started

### Requirements

- Node.js 20 or later
- Vercel CLI
- OpenRouter API key
- An available open-weight model on OpenRouter

### Installation

Clone the repository:

git clone YOUR_REPOSITORY_URL

Navigate to the project:

cd listify-ai

Install the Vercel CLI:

npm install -g vercel

Create an environment file named `.env.local`.

Add your configuration:

OPENROUTER_API_KEY=your_api_key
OPENROUTER_MODEL=your_model_id

Run the development server:

vercel dev

Open the local URL shown in your terminal.

## Why Open Innovation?

Listify AI uses open-weight AI models to make useful
writing assistance accessible to small businesses.

Open-weight models offer flexibility in model selection,
reduce dependence on a single proprietary model provider,
and can potentially be self-hosted.

The current implementation accesses these models through
OpenRouter. Therefore, inference is performed remotely,
not locally or offline.

## Side Hustle Challenge

Listify AI was built for the Side Hustle challenge.

The goal is to create a practical AI-powered tool that
solves a real problem for independent sellers.

## Disclaimer

AI-generated content should be reviewed before publishing.

Product information is sent to the configured AI provider
for processing.

## License

MIT