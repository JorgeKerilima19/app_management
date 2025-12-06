import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const cookieStore = await cookies();
  const logged = cookieStore.get("logged")?.value;

  if (!logged) redirect("/login");

  redirect("/dashboard");
}
