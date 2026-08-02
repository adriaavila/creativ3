import { redirect } from "next/navigation";

export default function OpsCrmConnectionsPage() {
  redirect("/ops/crm?view=connections");
}
