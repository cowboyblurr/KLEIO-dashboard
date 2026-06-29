/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_ACTIONS === "true"

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubPages ? "/KLEIO-dashboard" : "",
  assetPrefix: isGithubPages ? "/KLEIO-dashboard/" : "",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
