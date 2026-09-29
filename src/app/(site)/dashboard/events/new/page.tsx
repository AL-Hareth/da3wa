import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { requireAppContext } from "@/lib/session";
import { NewEventForm } from "./new-event-form";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.newEvent.title };
}

export default async function NewEventPage() {
  const [{ user }, { t }] = await Promise.all([requireAppContext(), getI18n()]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.newEvent.title} subtitle={t.newEvent.subtitle} back={<BackLink href="/dashboard" label={t.nav.events} />} />
      <Card className="p-5 sm:p-8">
        <NewEventForm showClient={user.accountType !== "individual"} />
      </Card>
    </div>
  );
}
