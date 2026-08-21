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
import {
  type SocialPlatformKey,
  buildSocialUrl,
  buildWhatsAppUrl,
} from '@/lib/social-urls';
import { api } from '@/trpc/react';
import { LinkBentoSchema } from '@/types';
import { Globe } from 'lucide-react';
import { useParams } from 'next/navigation';
import type React from 'react';
import { type ReactNode, useState } from 'react';
import { BiLogoTelegram } from 'react-icons/bi';
import { BsDiscord, BsThreads, BsTwitterX } from 'react-icons/bs';
import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaTwitch,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa';

const SOCIAL_PRESETS = [
  {
    key: 'instagram' as const,
    name: 'Instagram',
    icon: <FaInstagram size={20} />,
    color: '#E4405F',
    placeholder: 'seu.usuario',
  },
  {
    key: 'youtube' as const,
    name: 'YouTube',
    icon: <FaYoutube size={20} />,
    color: '#FF0000',
    placeholder: 'seucanal',
  },
  {
    key: 'twitter' as const,
    name: 'Twitter / X',
    icon: <BsTwitterX size={18} />,
    color: '#000000',
    placeholder: 'seu_usuario',
  },
  {
    key: 'tiktok' as const,
    name: 'TikTok',
    icon: <FaTiktok size={18} />,
    color: '#000000',
    placeholder: 'seu.usuario',
  },
  {
    key: 'linkedin' as const,
    name: 'LinkedIn',
    icon: <FaLinkedinIn size={20} />,
    color: '#0A66C2',
    placeholder: 'seu-usuario',
  },
  {
    key: 'github' as const,
    name: 'GitHub',
    icon: <FaGithub size={20} />,
    color: '#333333',
    placeholder: 'seu-usuario',
  },
  {
    key: 'discord' as const,
    name: 'Discord',
    icon: <BsDiscord size={20} />,
    color: '#5A65EA',
    placeholder: 'convite',
  },
  {
    key: 'twitch' as const,
    name: 'Twitch',
    icon: <FaTwitch size={18} />,
    color: '#9146FF',
    placeholder: 'seu_usuario',
  },
  {
    key: 'telegram' as const,
    name: 'Telegram',
    icon: <BiLogoTelegram size={22} />,
    color: '#0088CC',
    placeholder: 'seu_usuario',
  },
  {
    key: 'threads' as const,
    name: 'Threads',
    icon: <BsThreads size={18} />,
    color: '#000000',
    placeholder: 'seu.usuario',
  },
] satisfies {
  key: SocialPlatformKey;
  name: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
}[];

const WHATSAPP_PRESET = {
  name: 'WhatsApp',
  icon: <FaWhatsapp size={20} />,
  color: '#25D366',
};

function buildHref({
  isWhatsApp,
  whatsappPhone,
  whatsappMessage,
  activePreset,
  input,
}: {
  isWhatsApp: boolean;
  whatsappPhone: string;
  whatsappMessage: string;
  activePreset: { key: SocialPlatformKey } | undefined;
  input: string;
}) {
  if (isWhatsApp) {
    return buildWhatsAppUrl(whatsappPhone, whatsappMessage);
  }
  if (activePreset) {
    return buildSocialUrl(activePreset.key, input);
  }
  return input;
}

export default function CreateLinkBentoModal({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;

  const { link } = useParams<{ link: string }>();

  const [selectedPreset, setSelectedPreset] = useState<
    number | 'whatsapp' | null
  >(null);
  const [input, setInput] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const queryClient = api.useContext();

  const { mutateAsync: createBento, isPending } =
    api.profileLink.createBento.useMutation({
      onMutate: (bento) => {
        queryClient.profileLink.getByLink.setData({ link }, (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            bento: [...old.bento, LinkBentoSchema.parse(bento.bento)],
          };
        });
      },
      onSuccess: () => {
        setOpen(false);
        resetForm();
      },
      onSettled: () => {
        queryClient.profileLink.getByLink.invalidate({ link });
      },
    });

  const resetForm = () => {
    setInput('');
    setWhatsappPhone('');
    setWhatsappMessage('');
    setSelectedPreset(null);
  };

  const isWhatsApp = selectedPreset === 'whatsapp';
  const activePreset =
    typeof selectedPreset === 'number'
      ? SOCIAL_PRESETS[selectedPreset]
      : undefined;

  const href = buildHref({
    isWhatsApp,
    whatsappPhone,
    whatsappMessage,
    activePreset,
    input,
  });

  const canSubmit = isWhatsApp ? !!whatsappPhone : !!input;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }
    createBento({
      link,
      bento: {
        id: crypto.randomUUID(),
        type: 'link',
        href,
      },
    });
  };

  const placeholder = activePreset?.placeholder ?? 'https://example.com';

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          resetForm();
        }
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-cal text-xl">Adicionar Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Social presets grid */}
          <div className="grid grid-cols-4 gap-2">
            {SOCIAL_PRESETS.map((preset, i) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setSelectedPreset(selectedPreset === i ? null : i);
                  setInput('');
                }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-3 transition-all ${
                  selectedPreset === i
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted/50 hover:bg-muted'
                }`}
              >
                <span style={{ color: preset.color }}>{preset.icon}</span>
                <span className="truncate font-medium text-[10px] leading-tight">
                  {preset.name}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSelectedPreset(isWhatsApp ? null : 'whatsapp');
                setInput('');
              }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-3 transition-all ${
                isWhatsApp
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
            >
              <span style={{ color: WHATSAPP_PRESET.color }}>
                {WHATSAPP_PRESET.icon}
              </span>
              <span className="truncate font-medium text-[10px] leading-tight">
                {WHATSAPP_PRESET.name}
              </span>
            </button>
          </div>

          {/* Custom URL option */}
          {selectedPreset === null && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <div className="h-px flex-1 bg-border" />
              <span>ou cole qualquer URL</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isWhatsApp ? (
              <div className="space-y-3">
                <Input
                  type="tel"
                  placeholder="5511999999999"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="rounded-xl"
                  autoFocus
                />
                <Input
                  type="text"
                  placeholder="Mensagem inicial (opcional)"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  {activePreset ? (
                    <span style={{ color: activePreset.color }}>
                      {activePreset.icon}
                    </span>
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Input
                  type={activePreset ? 'text' : 'url'}
                  placeholder={placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="rounded-xl"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || isPending}
                className="rounded-xl px-6"
              >
                {isPending ? 'Adicionando...' : 'Adicionar link'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
