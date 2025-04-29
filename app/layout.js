import "./globals.css";

export const metadata = {
  title: "Olympix",
  description: "Olympic Games Data Visualization",
  icons: {
    icon: [
      { url: '/images/olympics-logo.svg', type: 'image/svg+xml' }
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Add Geist font via CDN */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/geist-font/dist/geist.min.css" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
