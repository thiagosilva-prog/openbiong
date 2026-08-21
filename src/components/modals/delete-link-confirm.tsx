'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { type ReactNode, useState } from 'react';

export default function DeleteLinkConfirmModal({
  linkSlug,
  linkName,
  children,
}: {
  linkSlug: string;
  linkName: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = api.useContext();

  const { mutateAsync: deleteLink, isPending } =
    api.profileLink.delete.useMutation({
      onSuccess: () => {
        queryClient.profileLink.getAll.invalidate();
        setOpen(false);
      },
      onError: (err) => {
        toast({
          title: 'Erro ao excluir',
          description: err.message,
        });
      },
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cal text-xl">
            Excluir "{linkName}"?
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Isso apaga a página{' '}
          <span className="font-medium">openbio.app/{linkSlug}</span>{' '}
          permanentemente, junto com todos os cards, estatísticas de
          visualização/clique e inscritos de e-mail. Essa ação não pode ser
          desfeita.
        </p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            className="rounded-xl px-6"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl px-6"
            disabled={isPending}
            onClick={() => deleteLink({ link: linkSlug })}
          >
            {isPending ? 'Excluindo...' : 'Sim, excluir'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
