import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import { CartProvider } from "./context/CartContext";

import "./globals.css";

export const metadata: Metadata = {
  title: "Coding Challenge App",
  description: "Mural Pay Coding Challenge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="cupcake">
      <body className="antialiased">
        <CartProvider>
          <Navbar />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
