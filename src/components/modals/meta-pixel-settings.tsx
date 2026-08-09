'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { CheckCircle2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

const DIGITS_ONLY_RE = /\D/g;

export default function MetaPixelSettingsModal({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { link } = useParams<{ link: string }>();
  const queryClient = api.useContext();

  const { data: profileLink } = api.profileLink.getByLink.useQuery({ link });

  const [pixelId, setPixelId] = useState(profileLink?.metaPixelId ?? '');
  const [capiToken, setCapiToken] = useState('');

  const hasCapiToken = profileLink?.hasMetaCapiToken ?? false;

  const { mutateAsync: updateLink, isPending } =
    api.profileLink.update.useMutation({
      onSuccess: () => {
        queryClient.profileLink.getByLink.invalidate({ link });
        router.refresh();
      },
      onError: (err) => {
        toast({ title: 'Erro', description: err.message });
      },
    });

  const save = async () => {
    if (!profileLink) {
      return;
    }
    const trimmedToken = capiToken.trim();
    await updateLink({
      id: profileLink.id,
      metaPixelId: pixelId.trim().replace(DIGITS_ONLY_RE, '') || null,
      ...(trimmedToken ? { metaCapiToken: trimmedToken } : {}),
    });
    setCapiToken('');
    toast({ title: 'Integração salva' });
    setOpen(false);
  };

  const removeCapiToken = async () => {
    if (!profileLink) {
      return;
    }
    await updateLink({ id: profileLink.id, metaCapiToken: null });
    toast({ title: 'Token removido' });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setPixelId(profileLink?.metaPixelId ?? '');
          setCapiToken('');
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-cal text-xl">Meta Pixel</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="meta-pixel-id" className="font-medium text-sm">
              ID do Pixel
            </Label>
            <Input
              id="meta-pixel-id"
              placeholder="123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              className="rounded-xl font-mono"
            />
            <p className="text-muted-foreground text-xs">
              Encontrado no Gerenciador de Eventos do Meta. Envia
              automaticamente PageView ao carregar a página e um evento a cada
              clique em um link — WhatsApp conta como "Contato".
            </p>
          </div>

          <div className="space-y-2 border-border border-t pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta-capi-token" className="font-medium text-sm">
                Conversions API (opcional)
              </Label>
              {hasCapiToken && (
                <span className="flex items-center gap-1 text-green-600 text-xs dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Configurado
                </span>
              )}
            </div>
            <Input
              id="meta-capi-token"
              type="password"
              placeholder={
                hasCapiToken
                  ? '•••••••••••••••• (deixe em branco para manter)'
                  : 'Cole o token de acesso aqui'
              }
              value={capiToken}
              onChange={(e) => setCapiToken(e.target.value)}
              className="rounded-xl font-mono"
            />
            <p className="text-muted-foreground text-xs">
              Envia os mesmos eventos direto do servidor, sem depender do
              navegador — mais preciso e resistente a bloqueadores de anúncio.
              Gerado no Gerenciador de Eventos → Configurações → Conversions
              API.
            </p>
            {hasCapiToken && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-0 text-destructive text-xs hover:text-destructive"
                onClick={() => {
                  removeCapiToken().catch(() => undefined);
                }}
                disabled={isPending}
              >
                Remover token
              </Button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-xl px-6"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                save().catch(() => undefined);
              }}
              disabled={isPending}
              className="rounded-xl px-6"
            >
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
