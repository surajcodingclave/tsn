import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Transport Management",
  description: "Multi-tenant transport, fleet & shipment management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}