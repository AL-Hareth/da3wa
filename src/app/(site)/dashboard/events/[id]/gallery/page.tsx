import { asc, eq } from "drizzle-orm";
import { Lock, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/dashboard/action-button";
import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { db, schema } from "@/lib/db";
import { requireEvent } from "@/lib/events/queries";
import { displayTitle } from "@/lib/events/view";
import { imageUrls } from "@/lib/images";
import { entitlements } from "@/lib/plans";
import { deletePhotoAction } from "./actions";
import { PhotoUploader } from "./photo-uploader";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.gallery.title };
}

export default async function GalleryPage(props: PageProps<"/dashboard/events/[id]/gallery">) {
  const { id } = await props.params;
  const [{ event }, { t, locale }] = await Promise.all([requireEvent(id), getI18n()]);
  const ent = entitlements(event.tier);
  const photos = await db.query.eventPhoto.findMany({
    where: eq(schema.eventPhoto.eventId, event.id),
    orderBy: [asc(schema.eventPhoto.sortOrder), asc(schema.eventPhoto.createdAt)],
  });

  return (
    <>
      <PageHeader
        back={<BackLink href={`/dashboard/events/${event.id}`} label={displayTitle(event, locale) ?? t.dashboard.untitled} />}
        title={t.gallery.title}
        subtitle={t.gallery.body}
        actions={ent.gallery ? <PhotoUploader eventId={event.id} label={t.gallery.upload} /> : null}
      />
      {!ent.gallery ? (
        <Card className="flex items-center gap-3 px-6 py-8 text-gold-dark">
          <Lock className="size-5" aria-hidden />
          {t.gallery.locked}
        </Card>
      ) : photos.length === 0 ? (
        <Card className="px-6 py-14 text-center text-sm text-muted">{t.gallery.empty}</Card>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => {
            const img = imageUrls(p.image);
            return (
              <li key={p.id} className="group relative overflow-hidden rounded-2xl border border-line bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                <div className="absolute end-2 top-2">
                  <ActionButton action={deletePhotoAction.bind(null, event.id, p.id)} variant="outline" size="sm" confirm={t.common.confirm} className="size-9 bg-card/90 px-0">
                    <Trash2 className="size-4 text-danger" aria-label={t.gallery.remove} />
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
