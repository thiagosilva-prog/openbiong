'use client';

import CardOverlay from '@/components/bento/overlay';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractAttributionParams } from '@/lib/attribution';
import type { getMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { LinkBentoSchema } from '@/types';
import { Link2, Pencil } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
import { BiLogoTelegram } from 'react-icons/bi';
import { BsDiscord, BsTwitterX } from 'react-icons/bs';
import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTwitch,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa';
import type * as z from 'zod';

type Metadata = Awaited<ReturnType<typeof getMetadata>>;
type BentoData = z.infer<typeof LinkBentoSchema>;

// Sizes that have proper layouts for link cards
export const LINK_CARD_SIZES = ['2x2', '4x1', '4x2'] as const;

type PlatformInfo = {
  icon: React.ReactNode;
  color: string;
  bg: string;
  action: { label: string; className: string };
};

const PLATFORM_MAP: Record<string, PlatformInfo> = {
  twitter: {
    icon: <BsTwitterX size={20} className="text-foreground" />,
    color: '#000000',
    bg: 'bg-foreground/5',
    action: {
      label: 'Seguir',
      className:
        'rounded-full bg-foreground text-background hover:bg-foreground/90',
    },
  },
  linkedin: {
    icon: <FaLinkedinIn size={20} className="text-[#0A66C2]" />,
    color: '#0A66C2',
    bg: 'bg-[#0A66C2]/5',
    action: {
      label: 'Conectar',
      className: 'rounded-full bg-[#0A66C2] text-white hover:bg-[#004182]',
    },
  },
  github: {
    icon: <FaGithub size={20} className="text-foreground" />,
    color: '#333333',
    bg: 'bg-gray-500/5',
    action: {
      label: 'Seguir',
      className: 'rounded-full',
    },
  },
  instagram: {
    icon: <FaInstagram size={20} className="text-[#F56040]" />,
    color: '#F56040',
    bg: 'bg-[#F56040]/5',
    action: {
      label: 'Seguir',
      className:
        'rounded-full bg-foreground text-background hover:bg-foreground/90',
    },
  },
  twitch: {
    icon: <FaTwitch size={20} className="text-[#9146FF]" />,
    color: '#9146FF',
    bg: 'bg-[#9146FF]/5',
    action: {
      label: 'Seguir',
      className: 'rounded-full bg-[#9146FF] text-white hover:bg-[#7c3aed]',
    },
  },
  telegram: {
    icon: <BiLogoTelegram size={24} className="text-[#0088CC]" />,
    color: '#0088CC',
    bg: 'bg-[#0088CC]/5',
    action: {
      label: 'Mensagem',
      className: 'rounded-full',
    },
  },
  discord: {
    icon: <BsDiscord size={24} className="text-[#5A65EA]" />,
    color: '#5A65EA',
    bg: 'bg-[#5A65EA]/5',
    action: {
      label: 'Entrar',
      className: 'rounded-full bg-[#5A65EA] text-white hover:bg-[#4752c4]',
    },
  },
  youtube: {
    icon: <FaYoutube size={20} className="text-[#FF0000]" />,
    color: '#FF0000',
    bg: 'bg-[#FF0000]/5',
    action: {
      label: 'Inscrever-se',
      className: 'rounded-full bg-[#FF0000] text-white hover:bg-[#cc0000]',
    },
  },
  whatsapp: {
    icon: <FaWhatsapp size={20} className="text-[#25D366]" />,
    color: '#25D366',
    bg: 'bg-[#25D366]/5',
    action: {
      label: 'Conversar',
      className: 'rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5b]',
    },
  },
};

function getPlatform(url: string): PlatformInfo | null | undefined {
  const hostname = new URL(url).hostname;
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return PLATFORM_MAP.twitter;
  }
  if (hostname.includes('linkedin.com')) {
    return PLATFORM_MAP.linkedin;
  }
  if (hostname.includes('github.com')) {
    return PLATFORM_MAP.github;
  }
  if (hostname.includes('instagram.com')) {
    return PLATFORM_MAP.instagram;
  }
  if (hostname.includes('twitch.tv')) {
    return PLATFORM_MAP.twitch;
  }
  if (hostname.includes('t.me') || hostname.includes('telegram.com')) {
    return PLATFORM_MAP.telegram;
  }
  if (hostname.includes('discord.com')) {
    return PLATFORM_MAP.discord;
  }
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return PLATFORM_MAP.youtube;
  }
  if (hostname.includes('wa.me') || hostname.includes('whatsapp.com')) {
    return PLATFORM_MAP.whatsapp;
  }
  return null;
}

function FaviconImage({ hostname, alt }: { hostname: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <Link2 className="h-4 w-4 text-muted-foreground" />;
  }

  return (
    <Image
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`}
      alt={alt}
      width={24}
      height={24}
      className="rounded-md"
      onError={() => setFailed(true)}
    />
  );
}

function getIcon(url: string, metadata?: Metadata) {
  const platform = getPlatform(url);
  if (platform) {
    return platform.icon;
  }
  const hostname = new URL(url).hostname;
  return <FaviconImage hostname={hostname} alt={metadata?.title ?? hostname} />;
}

function getLargeIcon(url: string) {
  const hostname = new URL(url).hostname;
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return <BsTwitterX size={32} className="text-foreground" />;
  }
  if (hostname.includes('linkedin.com')) {
    return <FaLinkedinIn size={32} className="text-[#0A66C2]" />;
  }
  if (hostname.includes('github.com')) {
    return <FaGithub size={32} className="text-foreground" />;
  }
  if (hostname.includes('instagram.com')) {
    return <FaInstagram size={32} className="text-[#F56040]" />;
  }
  if (hostname.includes('twitch.tv')) {
    return <FaTwitch size={32} className="text-[#9146FF]" />;
  }
  if (hostname.includes('t.me') || hostname.includes('telegram.com')) {
    return <BiLogoTelegram size={36} className="text-[#0088CC]" />;
  }
  if (hostname.includes('discord.com')) {
    return <BsDiscord size={36} className="text-[#5A65EA]" />;
  }
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return <FaYoutube size={32} className="text-[#FF0000]" />;
  }
  if (hostname.includes('wa.me') || hostname.includes('whatsapp.com')) {
    return <FaWhatsapp size={32} className="text-[#25D366]" />;
  }
  return null;
}

function getTitle(url: string, metadata?: Metadata) {
  const urlObj = new URL(url);
  if (
    urlObj.hostname.includes('wa.me') ||
    urlObj.hostname.includes('whatsapp.com')
  ) {
    return 'WhatsApp';
  }

  const pathSegments = urlObj.pathname.split('/');
  let userHandle = pathSegments.pop();
  if (!userHandle) {
    userHandle = pathSegments.pop();
  }

  if (getPlatform(url)) {
    return userHandle?.startsWith('@') ? userHandle : `@${userHandle}`;
  }
  return metadata?.title;
}

function getDescription(url: string, metadata?: Metadata) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const pathSegments = urlObj.pathname.split('/');
  let userHandle = pathSegments.pop();
  if (!userHandle) {
    userHandle = pathSegments.pop();
  }

  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return `x.com/${userHandle}`;
  }
  if (hostname.includes('linkedin.com')) {
    return `linkedin.com/in/${userHandle}`;
  }
  if (hostname.includes('github.com')) {
    return `github.com/${userHandle}`;
  }
  if (hostname.includes('instagram.com')) {
    return `instagr.am/${userHandle}`;
  }
  if (hostname.includes('twitch.tv')) {
    return `twitch.tv/${userHandle}`;
  }
  if (hostname.includes('t.me') || hostname.includes('telegram.com')) {
    return `t.me/${userHandle}`;
  }
  if (hostname.includes('discord.com')) {
    return 'discord.com';
  }
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return `youtube.com/${userHandle}`;
  }
  if (hostname.includes('wa.me') || hostname.includes('whatsapp.com')) {
    return 'Enviar mensagem';
  }
  return metadata?.description ?? null;
}

function getAction(url: string) {
  const platform = getPlatform(url);
  if (!platform) {
    return null;
  }
  return (
    <Button size="sm" className={platform.action.className}>
      {platform.action.label}
    </Button>
  );
}

function ActionButton({
  url,
  variant = 'default',
}: {
  url: string;
  variant?: 'default' | 'outline';
}) {
  const platform = getPlatform(url);
  if (!platform) {
    return null;
  }
  return (
    <Button
      size="sm"
      variant={variant}
      className={
        variant === 'outline' ? 'rounded-full' : platform.action.className
      }
    >
      {platform.action.label}
    </Button>
  );
}

// --- Layout Components ---

function CardWrapper({
  bento,
  editable,
  className,
  children,
  onEdit,
  listMode,
}: {
  bento: BentoData;
  editable?: boolean;
  className?: string;
  children: React.ReactNode;
  onEdit?: () => void;
  listMode?: boolean;
}) {
  const { link: linkSlug } = useParams<{ link: string }>();
  const searchParams = useSearchParams();
  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    { link: linkSlug },
    { enabled: !editable }
  );
  const { mutate: trackClick } = api.profileLink.trackClick.useMutation();

  const handleClick = () => {
    if (!editable && profileLink && bento.href) {
      trackClick({
        linkId: profileLink.id,
        bentoId: bento.id,
        href: bento.href,
        ...extractAttributionParams(searchParams),
      });
    }
  };

  const Comp = editable ? 'div' : Link;
  return (
    <Comp
      href={bento.href ?? ''}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
        editable
          ? 'transition-transform duration-200 ease-in-out md:cursor-move'
          : 'hover:-translate-y-0.5 cursor-pointer transition-all duration-200 hover:border-border/80 hover:shadow-md',
        className
      )}
    >
      {editable && (
        <CardOverlay
          bento={bento}
          allowedSizes={listMode ? [] : LINK_CARD_SIZES}
        />
      )}
      {children}
      {editable && onEdit && (
        <button
          type="button"
          className="absolute top-3 right-3 z-50 cursor-pointer rounded-lg border border-border/50 bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </Comp>
  );
}

function IconBadge({
  href,
  metadata,
  size = 'md',
}: {
  href: string;
  metadata?: Metadata;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-muted/50',
        size === 'sm' && 'h-8 w-8 rounded-lg',
        size === 'md' && 'h-10 w-10 rounded-xl',
        size === 'lg' && 'h-14 w-14 rounded-2xl'
      )}
    >
      {size === 'lg'
        ? (getLargeIcon(href) ?? getIcon(href, metadata))
        : getIcon(href, metadata)}
    </div>
  );
}

// 2x2: Compact card
function CompactLayout({
  bento,
  editable,
  metadata,
  title,
  description,
  onEdit,
}: {
  bento: BentoData;
  editable?: boolean;
  metadata?: Metadata;
  title?: string | null;
  description?: string | null;
  onEdit?: () => void;
}) {
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex flex-col p-5"
      onEdit={onEdit}
    >
      <IconBadge href={bento.href ?? ''} metadata={metadata} />
      <div className="mt-auto space-y-1">
        {title && <p className="font-cal text-sm leading-tight">{title}</p>}
        {description && (
          <p className="truncate text-muted-foreground text-xs">
            {description}
          </p>
        )}
        <div className="pt-1">{getAction(bento.href ?? '')}</div>
      </div>
    </CardWrapper>
  );
}

// 4x1: Banner — horizontal icon + title + action
function BannerLayout({
  bento,
  editable,
  metadata,
  title,
  onEdit,
  listMode,
}: {
  bento: BentoData;
  editable?: boolean;
  metadata?: Metadata;
  title?: string | null;
  onEdit?: () => void;
  listMode?: boolean;
}) {
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex items-center gap-x-3 px-5"
      onEdit={onEdit}
      listMode={listMode}
    >
      <IconBadge href={bento.href ?? ''} metadata={metadata} size="sm" />
      <span className="min-w-0 truncate font-cal text-sm">{title}</span>
      <div className="ml-auto shrink-0">{getAction(bento.href ?? '')}</div>
    </CardWrapper>
  );
}

// 4x2: Wide — social cards get branded accent, generic links get OG image
function WideLayout({
  bento,
  editable,
  metadata,
  title,
  description,
  onEdit,
}: {
  bento: BentoData;
  editable?: boolean;
  metadata?: Metadata;
  title?: string | null;
  description?: string | null;
  onEdit?: () => void;
}) {
  const href = bento.href ?? '';
  const platform = getPlatform(href);
  const ogImage = metadata?.image;

  // Generic link with OG image: image on the right
  if (!platform && ogImage) {
    return (
      <CardWrapper
        bento={bento}
        editable={editable}
        className="flex overflow-hidden"
        onEdit={onEdit}
      >
        <div className="flex flex-1 flex-col justify-between p-5">
          <IconBadge href={href} metadata={metadata} />
          <div className="mt-auto space-y-1">
            {title && <p className="font-cal text-sm leading-tight">{title}</p>}
            {description && (
              <p className="line-clamp-2 text-muted-foreground text-xs">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="relative w-2/5 shrink-0">
          <Image
            src={ogImage}
            alt={title ?? href}
            fill
            className="object-cover"
          />
        </div>
      </CardWrapper>
    );
  }

  // Social card or generic without OG: branded wide layout
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex overflow-hidden"
      onEdit={onEdit}
    >
      {/* Branded icon area */}
      <div
        className={cn(
          'flex w-35 shrink-0 items-center justify-center',
          platform?.bg ?? 'bg-muted/50'
        )}
      >
        <IconBadge href={href} metadata={metadata} size="lg" />
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col justify-center gap-y-1 p-5">
        {title && <p className="font-cal text-base leading-tight">{title}</p>}
        {description && (
          <p className="truncate text-muted-foreground text-xs">
            {description}
          </p>
        )}
        <div className="pt-2">
          <ActionButton url={href} />
        </div>
      </div>
    </CardWrapper>
  );
}

function LinkLayout({
  bento,
  editable,
  listMode,
  metadata,
  title,
  description,
  onEdit,
}: {
  bento: BentoData;
  editable?: boolean;
  listMode?: boolean;
  metadata?: Metadata;
  title?: string | null;
  description?: string | null;
  onEdit?: () => void;
}) {
  const smSize = bento.size.sm ?? '2x2';
  const mdSize = bento.size.md ?? '2x2';

  if (listMode || smSize === '4x1' || mdSize === '4x1') {
    return (
      <BannerLayout
        bento={bento}
        editable={editable}
        metadata={metadata}
        title={title}
        onEdit={onEdit}
        listMode={listMode}
      />
    );
  }

  if (mdSize === '4x2') {
    return (
      <WideLayout
        bento={bento}
        editable={editable}
        metadata={metadata}
        title={title}
        description={description}
        onEdit={onEdit}
      />
    );
  }

  return (
    <CompactLayout
      bento={bento}
      editable={editable}
      metadata={metadata}
      title={title}
      description={description}
      onEdit={onEdit}
    />
  );
}

// --- Main Component ---

export default function LinkCard({
  bento,
  editable,
  listMode,
}: {
  bento: BentoData;
  editable?: boolean;
  listMode?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [href, setHref] = useState(bento.href ?? '');
  const [customTitle, setCustomTitle] = useState(bento.title ?? '');

  const queryClient = api.useContext();
  const { mutateAsync: updateBento, isPending } =
    api.profileLink.updateBento.useMutation();

  const { data: metadata } = api.profileLink.getMetadataOfURL.useQuery(
    { url: bento.href ?? '' },
    { enabled: !!bento.href }
  );

  const handleSave = async () => {
    const nextTitle = customTitle.trim() || undefined;
    queryClient.profileLink.getByLink.setData({ link: params.link }, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        bento: old.bento.map((b) =>
          b.id === bento.id ? { ...b, href, title: nextTitle } : b
        ),
      };
    });

    await updateBento({
      link: params.link,
      bento: { ...bento, href, title: nextTitle },
    });
    setEditOpen(false);
  };

  if (!bento.href) {
    return null;
  }

  const title = bento.title || getTitle(bento.href, metadata ?? undefined);
  const description = getDescription(bento.href, metadata ?? undefined);
  const onEdit = editable ? () => setEditOpen(true) : undefined;

  return (
    <>
      <LinkLayout
        bento={bento}
        editable={editable}
        listMode={listMode}
        metadata={metadata ?? undefined}
        title={title}
        description={description}
        onEdit={onEdit}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cal text-xl">Editar Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-href" className="font-medium text-sm">
                URL
              </Label>
              <Input
                id="link-href"
                placeholder="https://example.com"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-title" className="font-medium text-sm">
                Título
              </Label>
              <Input
                id="link-title"
                placeholder="Ex: Nosso site, WhatsApp..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-muted-foreground text-xs">
                Deixe em branco para usar o título detectado automaticamente.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full rounded-xl"
            >
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
