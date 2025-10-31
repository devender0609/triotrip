// app/auth/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = false;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
