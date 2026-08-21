'use client';

import CardOverlay from '@/components/bento/overlay';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { HtmlBentoSchema } from '@/types';
import { Code2, Pencil } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof HtmlBentoSchema>;

export const HTML_CARD_SIZES = ['2x2', '4x1', '4x2', '2x4', '4x4'] as const;

// No allow-same-origin: the iframe gets an opaque, cookie-less origin, so
// even a broken or malicious snippet can't touch the OpenBio session or
// read/write anything outside itself.
const SANDBOX =
  'allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox';

function HtmlPreview({
  code,
  interactive = true,
}: {
  code: string;
  interactive?: boolean;
}) {
  return (
    <iframe
      srcDoc={code}
      sandbox={SANDBOX}
      title="Pré-visualização do HTML"
      className={cn(
        'h-full w-full rounded-2xl border-0 bg-white',
        // While editing, the card's own drag/resize/delete overlay needs to
        // receive every mouse event — an iframe is a separate document, and
        // even with a higher z-index above it, the browser still routes
        // hover/click straight into the iframe unless it's told not to.
        !interactive && 'pointer-events-none'
      )}
    />
  );
}

function HtmlEditor({
  initialCode,
  onSave,
  isSaving,
}: {
  initialCode: string;
  onSave: (code: string) => void;
  isSaving?: boolean;
}) {
  const [code, setCode] = useState(initialCode);

  return (
    <div className="space-y-3">
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="<div>Seu HTML aqui...</div>"
        spellCheck={false}
        className="h-40 w-full resize-y rounded-xl border border-border bg-card p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <p className="text-muted-foreground text-xs">
        Renderizado num iframe isolado (sandbox), sem acesso a cookies ou dados
        do OpenBio. Você é responsável pelo conteúdo inserido aqui.
      </p>
      {code && (
        <div className="h-40 overflow-hidden rounded-xl border border-border">
          <HtmlPreview code={code} />
        </div>
      )}
      <Button
        className="w-full rounded-xl"
        disabled={isSaving}
        onClick={() => onSave(code)}
      >
        {isSaving ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );
}

export default function HtmlCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = api.useContext();
  const { mutateAsync: updateBento, isPending } =
    api.profileLink.updateBento.useMutation();

  const hasContent = !!bento.code;

  const handleSave = (code: string) => {
    queryClient.profileLink.getByLink.cancel({ link: params.link });

    queryClient.profileLink.getByLink.setData({ link: params.link }, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        bento: old.bento.map((b) => (b.id === bento.id ? { ...b, code } : b)),
      };
    });

    updateBento({
      link: params.link,
      bento: { ...bento, code },
    });
    setEditOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          'group relative z-0 h-full w-full select-none overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
          editable &&
            'transition-transform duration-200 ease-in-out md:cursor-move'
        )}
      >
        {editable && (
          <CardOverlay bento={bento} allowedSizes={HTML_CARD_SIZES} />
        )}

        {hasContent ? (
          <HtmlPreview code={bento.code ?? ''} interactive={!editable} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Code2 className="h-6 w-6" />
            <p className="text-xs">{editable ? 'Sem HTML ainda' : ''}</p>
          </div>
        )}

        {editable && (
          <button
            type="button"
            className="absolute right-3 bottom-3 z-50 cursor-pointer rounded-lg border border-border/50 bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cal text-xl">
              Editar HTML Personalizado
            </DialogTitle>
          </DialogHeader>
          {editOpen && (
            <HtmlEditor
              initialCode={bento.code ?? ''}
              onSave={handleSave}
              isSaving={isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
