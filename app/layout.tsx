import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Blarp 2.0",
  description: "Onchain paid engagement campaigns on Farcaster",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
