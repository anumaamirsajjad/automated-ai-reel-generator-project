# Reelify (Frontend + Backend)

This project now includes:

- React frontend (Create React App)
- Local Express backend at `http://localhost:5000`
- Free image generation provider (Pollinations)
- Local reel rendering pipeline (FFmpeg)

## Quick Start

Install dependencies:

```bash
npm install
```

Run frontend + backend together:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` and calls backend endpoint:

- `POST /api/reel-generator`

Optional frontend env override:

- `REACT_APP_API_BASE_URL=http://localhost:5000`

## Gemini Integration (Recommended)

To improve prompt relevance, the backend can generate scene images with Gemini first, then stitch into a reel.

Create a `.env` file in the project root with:

```bash
GEMINI_API_KEY=your_google_ai_api_key
GEMINI_IMAGE_MODEL=gemini-2.0-flash-preview-image-generation
```

If Gemini is unavailable for a request, backend fallback order is:

1. Pollinations image generation
2. Wikimedia prompt-keyword images
3. Keyword photo fallback
4. Prompt-based synthetic MP4 fallback

## API Response Notes

`/api/reel-generator` now follows a two-step flow:

1. Generate multiple scene images from your prompt
2. Stitch those images into an MP4 reel

The endpoint response can return either:

- `videoUrl` (default successful path)
- `imageUrl` (fallback if video stitching fails)

The UI supports both preview types.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
