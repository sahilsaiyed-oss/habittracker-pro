import { redirect } from "next/navigation";

export default function Home() {
  // Middleware automatically handle kar lega, par default redirection /login par rakho
  redirect("/login");
}