'use client';

import BioWriter from '@/components/ai/bio-writer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OpenBioLogo from '@/public/openbio.png';
import { api } from '@/trpc/react';
import {
  AtSign,
  Link2,
  Loader2,
  MessageCircle,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
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

const SOCIALS = [
  { key: 'twitter', name: 'X', icon: BsTwitterX, placeholder: 'username' },
  { key: 'github', name: 'GitHub', icon: FaGithub, placeholder: 'username' },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: FaInstagram,
    placeholder: 'username',
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: FaLinkedinIn,
    placeholder: 'username',
  },
  { key: 'youtube', name: 'YouTube', icon: FaYoutube, placeholder: 'channel' },
  {
    key: 'discord',
    name: 'Discord',
    icon: BsDiscord,
    placeholder: 'username',
  },
  {
    key: 'telegram',
    name: 'Telegram',
    icon: BiLogoTelegram,
    placeholder: 'username',
  },
  { key: 'twitch', name: 'Twitch', icon: FaTwitch, placeholder: 'username' },
] as const;

const SOCIAL_URLS: Record<string, string> = {
  twitter: 'x.com',
  github: 'github.com',
  instagram: 'instagram.com',
  linkedin: 'linkedin.com/in',
  youtube: 'youtube.com/@',
  discord: 'discord.com',
  telegram: 't.me',
  twitch: 'twitch.tv',
};

const SOCIAL_COLORS: Record<string, { text: string; bg: string }> = {
  twitter: { text: 'text-foreground', bg: 'bg-foreground/5' },
  github: { text: 'text-foreground', bg: 'bg-gray-500/5' },
  instagram: { text: 'text-[#F56040]', bg: 'bg-[#F56040]/5' },
  linkedin: { text: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/5' },
  youtube: { text: 'text-[#FF0000]', bg: 'bg-[#FF0000]/5' },
  discord: { text: 'text-[#5A65EA]', bg: 'bg-[#5A65EA]/5' },
  telegram: { text: 'text-[#0088CC]', bg: 'bg-[#0088CC]/5' },
  twitch: { text: 'text-[#9146FF]', bg: 'bg-[#9146FF]/5' },
};

const SOCIAL_ACTIONS: Record<string, string> = {
  twitter: 'Seguir',
  github: 'Seguir',
  instagram: 'Seguir',
  linkedin: 'Conectar',
  youtube: 'Inscrever-se',
  discord: 'Entrar',
  telegram: 'Mensagem',
  twitch: 'Seguir',
};

const PROTOCOL_RE = /^https?:\/\//;
const NON_DIGIT_RE = /\D/g;

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  return PROTOCOL_RE.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isCompleteUrl(url: string) {
  try {
    return new URL(url).hostname.includes('.');
  } catch {
    return false;
  }
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function buildWhatsAppUrl(number: string, message: string) {
  const digits = number.replace(NON_DIGIT_RE, '');
  if (!digits) {
    return '';
  }
  const query = message.trim()
    ? `?text=${encodeURIComponent(message.trim())}`
    : '';
  return `https://wa.me/${digits}${query}`;
}

function WhatsAppPreviewCard() {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-border/50 bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366]/5">
          <FaWhatsapp size={16} className="text-[#25D366]" />
        </div>
        <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[9px] text-background">
          Mensagem
        </span>
      </div>
      <div className="mt-2">
        <p className="truncate font-medium text-[10px]">WhatsApp</p>
      </div>
    </div>
  );
}

function CustomLinkPreviewCard({
  url,
  title,
}: {
  url: string;
  title?: string;
}) {
  let hostname = url;
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch {
    // keep raw url as fallback label
  }

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-border/50 bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Link2 size={16} className="text-foreground" />
        </div>
        <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[9px] text-background">
          Visitar
        </span>
      </div>
      <div className="mt-2">
        <p className="truncate font-medium text-[10px]">{title || hostname}</p>
      </div>
    </div>
  );
}

function LinkMetadataPreview({ url }: { url: string }) {
  const { data: metadata, isFetching } =
    api.profileLink.getMetadataOfURL.useQuery(
      { url },
      { enabled: !!url, staleTime: 5 * 60_000 }
    );

  if (isFetching) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        Carregando pré-visualização...
      </div>
    );
  }

  if (!(metadata?.title || metadata?.description)) {
    return null;
  }

  let hostname = url;
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch {
    // keep raw url as fallback label
  }

  return (
    <div className="flex gap-3 overflow-hidden rounded-lg border border-border/40 bg-muted/30 p-2.5">
      {metadata.image && (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={metadata.image}
            alt={metadata.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate font-medium text-xs">{metadata.title}</p>
        {metadata.description && (
          <p className="line-clamp-2 text-[11px] text-muted-foreground leading-snug">
            {metadata.description}
          </p>
        )}
        <p className="truncate text-[10px] text-muted-foreground/70 uppercase">
          {hostname}
        </p>
      </div>
    </div>
  );
}

function CustomLinkRow({
  item,
  index,
  showRemove,
  onChange,
  onRemove,
}: {
  item: { url: string; title: string };
  index: number;
  showRemove: boolean;
  onChange: (index: number, field: 'url' | 'title', value: string) => void;
  onRemove: (index: number) => void;
}) {
  const normalizedUrl = normalizeUrl(item.url);
  const debouncedUrl = useDebouncedValue(normalizedUrl, 600);
  const previewUrl = isCompleteUrl(debouncedUrl) ? debouncedUrl : '';

  return (
    <div className="space-y-1.5 rounded-xl border border-border/50 bg-background px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <input
          className="flex-1 bg-transparent text-muted-foreground text-xs outline-none placeholder:text-muted-foreground/70"
          placeholder="Título (opcional)"
          value={item.title}
          onChange={(e) => onChange(index, 'title', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2.5">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="https://exemplo.com"
          value={item.url}
          onChange={(e) => onChange(index, 'url', e.target.value)}
        />
        {showRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {previewUrl && <LinkMetadataPreview url={previewUrl} />}
    </div>
  );
}

function PreviewCard({
  platform,
  username,
  icon: Icon,
}: {
  platform: string;
  username: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  const colors = SOCIAL_COLORS[platform] ?? {
    text: 'text-foreground',
    bg: 'bg-muted',
  };
  const action = SOCIAL_ACTIONS[platform] ?? 'Visitar';
  const url = SOCIAL_URLS[platform] ?? '';

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-border/50 bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}
        >
          <Icon size={16} className={colors.text} />
        </div>
        <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[9px] text-background">
          {action}
        </span>
      </div>
      <div className="mt-2">
        <p className="truncate font-medium text-[10px]">@{username}</p>
        <p className="truncate text-[8px] text-muted-foreground">
          {url}/{username}
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  const searchParams = useSearchParams();
  const link = searchParams.get('link') ?? '';
  const router = useRouter();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [customLinks, setCustomLinks] = useState<
    { url: string; title: string }[]
  >([{ url: '', title: '' }]);
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createLink } = api.profileLink.create.useMutation();

  const handleSocialChange = (key: string, value: string) => {
    setSocials((prev) => ({ ...prev, [key]: value }));
  };

  const handleCustomLinkChange = (
    index: number,
    field: 'url' | 'title',
    value: string
  ) => {
    setCustomLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addCustomLink = () =>
    setCustomLinks((prev) => [...prev, { url: '', title: '' }]);

  const removeCustomLink = (index: number) =>
    setCustomLinks((prev) => prev.filter((_, i) => i !== index));

  const filledSocials = Object.entries(socials).filter(([, v]) => v);
  const filledCustomLinks = customLinks
    .map((item) => ({ url: normalizeUrl(item.url), title: item.title.trim() }))
    .filter((item) => item.url);
  const whatsappUrl = buildWhatsAppUrl(whatsapp, whatsappMessage);
  const allCustomLinks = whatsappUrl
    ? [...filledCustomLinks, { url: whatsappUrl, title: '' }]
    : filledCustomLinks;
  const customLinksPayload =
    allCustomLinks.length > 0
      ? allCustomLinks.map((item) => ({
          url: item.url,
          title: item.title || undefined,
        }))
      : undefined;

  const handlePublish = async () => {
    if (!link || !name) {
      return;
    }
    setLoading(true);
    try {
      await createLink({
        link,
        name: name || undefined,
        bio: bio || undefined,
        twitter: socials.twitter || undefined,
        github: socials.github || undefined,
        linkedin: socials.linkedin || undefined,
        instagram: socials.instagram || undefined,
        telegram: socials.telegram || undefined,
        discord: socials.discord || undefined,
        youtube: socials.youtube || undefined,
        twitch: socials.twitch || undefined,
        customLinks: customLinksPayload,
      });
      router.push(`/${link}?edit=1`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl animate-fade-up overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
          {/* Left — Form */}
          <div className="space-y-6 p-8">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Image src={OpenBioLogo} alt="OpenBio" width={36} height={36} />
              </Link>
              <div>
                <h1 className="font-cal text-xl">Configure sua página</h1>
                <p className="text-muted-foreground text-xs">
                  openbio.app/{link}
                </p>
              </div>
            </div>

            {/* Name + Bio */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium text-sm">
                  Nome de exibição
                </Label>
                <Input
                  id="name"
                  placeholder="Maria Silva"
                  className="rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio" className="font-medium text-sm">
                    Bio
                  </Label>
                  <BioWriter
                    name={name || link}
                    links={filledSocials.map(
                      ([k, v]) => `${SOCIAL_URLS[k] ?? k}/${v}`
                    )}
                    onGenerated={setBio}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-violet-500 text-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      Escrever com IA
                    </Button>
                  </BioWriter>
                </div>
                <textarea
                  id="bio"
                  rows={2}
                  placeholder="Conte ao mundo um pouco sobre você..."
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <Label className="font-medium text-sm">Redes sociais</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SOCIALS.map((social) => (
                  <div
                    key={social.key}
                    className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background px-3 py-2.5"
                  >
                    <social.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 items-center gap-1">
                      <AtSign className="h-3 w-3 text-muted-foreground" />
                      <input
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        placeholder={social.placeholder}
                        value={socials[social.key] ?? ''}
                        onChange={(e) =>
                          handleSocialChange(social.key, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-3">
              <Label className="font-medium text-sm">WhatsApp</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background px-3 py-2.5">
                  <FaWhatsapp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="5511999999999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background px-3 py-2.5">
                  <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Mensagem personalizada (opcional)"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Inclua o código do país, somente números (ex.: 5511999999999).
              </p>
            </div>

            {/* Custom Links */}
            <div className="space-y-3">
              <Label className="font-medium text-sm">Links</Label>
              <div className="space-y-2">
                {customLinks.map((item, index) => (
                  <CustomLinkRow
                    key={index}
                    item={item}
                    index={index}
                    showRemove={customLinks.length > 1}
                    onChange={handleCustomLinkChange}
                    onRemove={removeCustomLink}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={addCustomLink}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar outro link
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/claim-link"
                className="text-muted-foreground text-sm hover:text-foreground"
              >
                ← Voltar
              </Link>
              <GradientButton
                onClick={() => {
                  handlePublish().catch(console.error);
                }}
                disabled={loading || !name}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar página'
                )}
              </GradientButton>
            </div>
          </div>

          {/* Right — Live Preview (actual profile layout) */}
          <div className="hidden border-border/50 border-l bg-muted/20 lg:block">
            <div className="sticky top-0 p-5">
              <p className="mb-3 font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
                Pré-visualização ao vivo
              </p>

              {/* Scaled-down profile preview */}
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm">
                <div className="p-5">
                  {/* Header — matches actual profile layout */}
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-14 w-14 shadow-sm">
                      <AvatarFallback className="bg-foreground text-background text-lg">
                        {name?.charAt(0)?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-2.5 font-cal text-base">
                      {name || 'Seu Nome'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      @{link || 'usuario'}
                    </p>
                    {bio && (
                      <p className="mt-1.5 line-clamp-2 max-w-[220px] text-[10px] text-muted-foreground leading-relaxed">
                        {bio}
                      </p>
                    )}
                  </div>

                  {/* Bento grid preview */}
                  {(filledSocials.length > 0 ||
                    filledCustomLinks.length > 0 ||
                    whatsappUrl) && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {filledSocials.map(([platform, username]) => {
                        const social = SOCIALS.find((s) => s.key === platform);
                        if (!social) {
                          return null;
                        }
                        return (
                          <PreviewCard
                            key={platform}
                            platform={platform}
                            username={username}
                            icon={social.icon}
                          />
                        );
                      })}
                      {whatsappUrl && <WhatsAppPreviewCard />}
                      {filledCustomLinks.map((item) => (
                        <CustomLinkPreviewCard
                          key={item.url}
                          url={item.url}
                          title={item.title}
                        />
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {filledSocials.length === 0 &&
                    filledCustomLinks.length === 0 &&
                    !whatsappUrl && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex h-20 items-center justify-center rounded-xl border border-border/40 border-dashed bg-muted/30"
                          >
                            <span className="text-[9px] text-muted-foreground/30">
                              Cartão
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Footer */}
                  <div className="mt-4 text-center">
                    <span className="text-[8px] text-muted-foreground/50">
                      openbio.app/{link || 'usuario'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
