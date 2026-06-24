/**
 * Vercel Serverless Function Entry Point for piTrahan API
 * 
 * This file wraps the Express app from backend/server.js and exports it
 * as a Vercel serverless handler. The Express app handles all /api/* routes.
 */

const app = require('../backend/server');

module.exports = app;
