// app/layout.tsx
export const metadata = {
  title: "TrioTrip",
  description: "Compare flights & hotels beautifully",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
