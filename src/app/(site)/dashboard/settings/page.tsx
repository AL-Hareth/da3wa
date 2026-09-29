import { and, eq } from "drizzle-orm";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { db, schema } from "@/lib/db";
import { requireAppContext } from "@/lib/session";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "./settings-forms";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.settings.title };
}

export default async function SettingsPage() {
  const [{ user }, { t }] = await Promise.all([requireAppContext(), getI18n()]);
  const credential = await db.query.account.findFirst({
    where: and(eq(schema.account.userId, user.id), eq(schema.account.providerId, "credential")),
    columns: { id: true },
  });
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.settings.title} subtitle={<span dir="ltr">{user.email}</span>} />
      <div className="space-y-6">
        <Card>
          <CardHeader title={t.settings.profile} />
          <CardBody>
            <ProfileForm name={user.name} accountType={user.accountType ?? "individual"} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t.settings.password} />
          <CardBody>{credential ? <PasswordForm /> : <p className="text-sm text-muted">{t.settings.googleAccount}</p>}</CardBody>
        </Card>
        <Card className="border-danger/30">
          <CardHeader title={t.settings.deleteAccount} />
          <CardBody>
            <DeleteAccountForm hasPassword={!!credential} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
