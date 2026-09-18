import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allows the dev server's JS/HMR requests through when accessed via a
  // localtunnel URL during phone testing (each run gets a random
  // *.loca.lt subdomain) — without this, Next.js silently blocks those
  // cross-origin dev requests and the page loads but nothing is interactive.
  allowedDevOrigins: ["*.loca.lt"],
};

export default nextConfig;
