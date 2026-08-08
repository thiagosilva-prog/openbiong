'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { useState } from 'react';

export default function EmailDigestToggle({
  defaultEnabled,
}: {
  defaultEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  const { mutate } = api.user.updateEmailDigest.useMutation({
    onSuccess: (data) => {
      setEnabled(data.emailDigest);
      toast({
        title: data.emailDigest ? 'Resumo ativado' : 'Resumo desativado',
        description: data.emailDigest
          ? 'Você receberá e-mails semanais com o resumo de estatísticas.'
          : 'Você não receberá mais e-mails de resumo.',
      });
    },
  });

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="email-digest">Resumo semanal de estatísticas</Label>
        <p className="text-muted-foreground text-xs">
          Receba um resumo semanal das visualizações, cliques e inscritos do seu
          perfil.
        </p>
      </div>
      <Switch
        id="email-digest"
        checked={enabled}
        onCheckedChange={(checked) => mutate({ enabled: checked })}
      />
    </div>
  );
}
