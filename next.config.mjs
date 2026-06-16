/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname = "";
try {
  if (supabaseUrl) supabaseHostname = new URL(supabaseUrl).hostname;
} catch {
  supabaseHostname = "";
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: "https", hostname: supabaseHostname }]
        : []),
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
