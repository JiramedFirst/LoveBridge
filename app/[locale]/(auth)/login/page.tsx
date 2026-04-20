import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (session?.user) redirect(`/${locale}`);

  return (
    <div className="min-h-screen grid place-items-center bg-muted p-4">
      <LoginForm locale={locale} />
    </div>
  );
}
