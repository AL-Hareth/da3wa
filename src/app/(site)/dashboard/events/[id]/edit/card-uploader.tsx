"use client";

import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useI18n } from "@/i18n/client";
import { buttonClass } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";
import { removeCardImageAction, uploadCardImageAction, type ActionState } from "../../actions";

const MAX = 10 * 1024 * 1024;

export function CardUploader({ eventId, current, onChanged }: { eventId: string; current: { thumb: string; width: number; height: number } | null; onChanged: () => void }) {
  const { t } = useI18n();
  const d = t.editor.design;
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadCardImageAction.bind(null, eventId), null);
  const [removing, startRemove] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (state?.ok) onChanged();
  }, [state, onChanged]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-soft">{d.cardImage}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="grid aspect-[3/4] w-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-paper">
          {pending ? (
            <Loader2 className="size-6 animate-spin text-muted" aria-label={d.uploading} />
          ) : current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.thumb} alt="" className="size-full object-cover" />
          ) : (
            <ImageUp className="size-7 text-muted" aria-hidden />
          )}
        </div>
        <div className="space-y-3">
          <form ref={formRef} action={action}>
            <label className={buttonClass("outline", "sm", "cursor-pointer")}>
              <ImageUp className="size-4" aria-hidden />
              {pending ? d.uploading : current ? d.replaceButton : d.uploadButton}
              <input
                type="file"
                name="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={pending}
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0];
                  if (!f) return;
                  if (f.size > MAX) {
                    setClientError(t.editor.errors.image.too_large);
                    e.currentTarget.value = "";
                    return;
                  }
                  setClientError(null);
                  formRef.current?.requestSubmit();
                }}
              />
            </label>
          </form>
          {current && (
            <button
              type="button"
              disabled={removing || pending}
              onClick={() =>
                startRemove(async () => {
                  await removeCardImageAction(eventId);
                  onChanged();
                })
              }
              className={buttonClass("ghost", "sm", "text-danger")}
            >
              <Trash2 className="size-4" aria-hidden />
              {d.removeButton}
            </button>
          )}
          <p className="max-w-sm text-xs leading-relaxed text-muted">{d.cardHint}</p>
        </div>
      </div>
      {clientError ? <FormMessage>{clientError}</FormMessage> : state && !state.ok && state.error && <FormMessage>{state.error}</FormMessage>}
    </div>
  );
}
