import { inviteStrings } from "@/i18n/invite";
import { StatusPage } from "./status-page";

export default function NotFound() {
  const s = inviteStrings.ar;
  return <StatusPage title={s.unavailable.title} body={s.unavailable.body} />;
}
