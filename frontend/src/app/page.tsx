import { redirect } from "next/navigation";

export default function Home() {
  // Esta instrucción atrapa al usuario en la ruta principal (/) 
  // y lo manda inmediatamente a la pantalla de login.
  redirect("/login");
}