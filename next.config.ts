import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Brand images are up to 2 MB (task 03). The default 1 MB would reject them, and the
      // limit counts the whole multipart body, so leave headroom above 2 MB.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
