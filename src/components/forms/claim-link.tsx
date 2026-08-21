'use client';

import { claimLink } from '@/app/actions/claim-link';
import { GradientButton } from '@/components/ui/gradient-button';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/trpc/react';
import { RESERVED_LINKS } from '@/types';
import { Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';

const VALID_LINK_RE = /^[a-z0-9-]+$/;

function getFormatError(value: string): string | undefined {
  const lower = value.toLowerCase();
  if (lower.length < 3) {
    return 'Deve ter pelo menos 3 caracteres.';
  }
  if (lower.length > 50) {
    return 'Deve ter no máximo 50 caracteres.';
  }
  if (!VALID_LINK_RE.test(lower)) {
    return 'Use apenas letras, números e hífens — sem espaços, "_" ou outros símbolos.';
  }
  if (RESERVED_LINKS.includes(lower)) {
    return 'Esse nome é reservado pelo sistema.';
  }
  return;
}

function StatusIcon({
  isFetching,
  available,
}: {
  isFetching: boolean;
  available: boolean | undefined;
}) {
  if (isFetching) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
  if (available) {
    return <Check className="h-4 w-4 text-green-500" />;
  }
  return <X className="h-4 w-4 text-red-500" />;
}

export default function ClaimLinkForm() {
  const [link, setLink] = useState('');
  const debouncedLink = useDebounce(link, 500);
  const formatError = debouncedLink ? getFormatError(debouncedLink) : undefined;
  const hasValidFormat = !!debouncedLink && !formatError;

  const { data: available, isFetching } =
    api.profileLink.linkAvailable.useQuery(
      { link: debouncedLink },
      { enabled: hasValidFormat, staleTime: Number.POSITIVE_INFINITY }
    );

  const handleAction = () => {
    if (!hasValidFormat || isFetching || !available) {
      return;
    }
    claimLink(link).catch(console.error);
  };

  return (
    <form className="space-y-4" action={handleAction}>
      <div className="flex h-12 items-center gap-x-1 rounded-xl border border-input bg-background px-4 shadow-sm focus-within:ring-2 focus-within:ring-violet-500/50">
        <span className="text-muted-foreground text-sm">openbio.app/</span>
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoFocus
          placeholder="seunome"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        {debouncedLink && (
          <div className="ml-auto">
            <StatusIcon
              isFetching={hasValidFormat && isFetching}
              available={hasValidFormat ? available : false}
            />
          </div>
        )}
      </div>
      {debouncedLink && formatError && (
        <p className="text-center text-red-500 text-sm">{formatError}</p>
      )}
      {hasValidFormat && !isFetching && !available && (
        <p className="text-center text-red-500 text-sm">
          Este nome de usuário já está em uso
        </p>
      )}
      {hasValidFormat && !isFetching && available && (
        <GradientButton type="submit" className="w-full">
          Reservar minha página
        </GradientButton>
      )}
      <p className="text-center">
        <a
          href="/app"
          className="text-muted-foreground text-xs transition-colors hover:text-foreground"
        >
          ← Voltar ao painel
        </a>
      </p>
    </form>
  );
}
