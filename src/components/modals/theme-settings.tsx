'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { THEME_PRESETS } from '@/lib/themes';
import { getUploadButtonLabel, uploadBentoImage } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  Image as ImageIcon,
  Moon,
  Paintbrush,
  Palette,
  Type,
} from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { type ChangeEvent, type ReactNode, useRef, useState } from 'react';

type ContentAlign = 'left' | 'center' | 'right';

const ALIGN_OPTIONS: { value: ContentAlign; label: string; icon: ReactNode }[] =
  [
    {
      value: 'left',
      label: 'Esquerda',
      icon: <AlignLeft className="h-4 w-4" />,
    },
    {
      value: 'center',
      label: 'Centralizado',
      icon: <AlignCenter className="h-4 w-4" />,
    },
    {
      value: 'right',
      label: 'Direita',
      icon: <AlignRight className="h-4 w-4" />,
    },
  ];

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <p className="font-medium text-sm">{title}</p>
    </div>
  );
}

export default function ThemeSettingsModal({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { link } = useParams<{ link: string }>();
  const queryClient = api.useContext();

  const { data: profileLink } = api.profileLink.getByLink.useQuery({ link });

  const [theme, setTheme] = useState(profileLink?.theme ?? 'default');
  const [darkMode, setDarkMode] = useState(profileLink?.darkMode ?? false);
  const [accentColor, setAccentColor] = useState(
    profileLink?.accentColor ?? ''
  );
  const [customFooter, setCustomFooter] = useState(
    profileLink?.customFooter ?? ''
  );
  const [contentAlign, setContentAlign] = useState<ContentAlign>(
    (profileLink?.contentAlign as ContentAlign | undefined) ?? 'left'
  );
  const [backgroundImage, setBackgroundImage] = useState(
    profileLink?.backgroundImage ?? ''
  );
  const [uploadingBg, setUploadingBg] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: updateLink, isPending } =
    api.profileLink.update.useMutation({
      onSuccess: () => {
        queryClient.profileLink.getByLink.invalidate({ link });
        router.refresh();
        setOpen(false);
      },
    });

  const handleBgFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingBg(true);
    try {
      setBackgroundImage(await uploadBentoImage(file));
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha no envio',
      });
    } finally {
      setUploadingBg(false);
    }
  };

  const save = () => {
    if (!profileLink) {
      return;
    }
    updateLink({
      id: profileLink.id,
      theme,
      darkMode,
      accentColor: accentColor || null,
      customFooter: customFooter || null,
      contentAlign,
      backgroundImage: backgroundImage || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-h-[85vh] overflow-hidden sm:max-w-lg"
        showClose
      >
        <DialogHeader>
          <DialogTitle className="font-cal text-xl">Personalizar</DialogTitle>
        </DialogHeader>

        <div
          className="-mx-6 overflow-y-auto px-6 pb-1"
          style={{ maxHeight: 'calc(85vh - 160px)' }}
        >
          <div className="space-y-6">
            {/* Theme Presets */}
            <div className="space-y-3">
              <SectionHeader
                icon={<Palette className="h-4 w-4" />}
                title="Tema"
              />
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const isActive = theme === preset.name;
                  const colors = darkMode
                    ? preset.colors.dark
                    : preset.colors.light;
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all',
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80 hover:bg-muted/30'
                      )}
                      onClick={() => setTheme(preset.name)}
                    >
                      <div className="-space-x-1 flex">
                        <span
                          className="h-5 w-5 rounded-full border border-white/20 shadow-sm"
                          style={{ background: colors['--background'] }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-white/20 shadow-sm"
                          style={{ background: colors['--primary'] }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-white/20 shadow-sm"
                          style={{ background: colors['--card'] }}
                        />
                      </div>
                      <span className="flex-1 truncate font-medium text-xs">
                        {preset.label}
                      </span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Image */}
            <div className="space-y-3">
              <SectionHeader
                icon={<ImageIcon className="h-4 w-4" />}
                title="Imagem de Fundo"
              />
              {backgroundImage ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border">
                  <Image
                    src={backgroundImage}
                    alt="Pré-visualização do fundo"
                    fill
                    sizes="(max-width: 640px) 100vw, 512px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border border-dashed bg-muted/50">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleBgFileChange}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={uploadingBg}
                  onClick={() => bgFileInputRef.current?.click()}
                >
                  {getUploadButtonLabel(uploadingBg, !!backgroundImage)}
                </Button>
                {backgroundImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl text-xs"
                    onClick={() => setBackgroundImage('')}
                  >
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Aparece atrás de toda a página, com um degradê escuro por cima
                para manter o texto legível. Ative o Modo Escuro abaixo para o
                melhor contraste.
              </p>
            </div>

            {/* Dark Mode */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeader
                  icon={<Moon className="h-4 w-4" />}
                  title="Modo Escuro"
                />
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </div>

            {/* Content Alignment */}
            <div className="space-y-3">
              <SectionHeader
                icon={<AlignCenter className="h-4 w-4" />}
                title="Alinhamento da Página"
              />
              <div className="grid grid-cols-3 gap-2">
                {ALIGN_OPTIONS.map((option) => {
                  const isActive = contentAlign === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-xs transition-all',
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80 hover:bg-muted/30'
                      )}
                      onClick={() => setContentAlign(option.value)}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <SectionHeader
                icon={<Paintbrush className="h-4 w-4" />}
                title="Cor de Destaque"
              />
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="color"
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-xl border border-border bg-transparent"
                    value={accentColor || '#000000'}
                    onChange={(e) => setAccentColor(e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  className="h-9 w-full rounded-xl border border-border bg-card px-3 font-mono text-sm"
                  placeholder="#000000"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
                {accentColor && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 rounded-xl text-xs"
                    onClick={() => setAccentColor('')}
                  >
                    Redefinir
                  </Button>
                )}
              </div>
            </div>

            {/* Custom Footer */}
            <div className="space-y-3">
              <SectionHeader
                icon={<Type className="h-4 w-4" />}
                title="Texto do Rodapé"
              />
              <input
                type="text"
                className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm"
                placeholder="Feito com OpenBio"
                value={customFooter}
                maxLength={100}
                onChange={(e) => setCustomFooter(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Exibido na parte inferior da sua página de perfil.
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-border border-t pt-4">
          <Button
            variant="outline"
            className="rounded-xl px-6"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={isPending}
            className="rounded-xl px-6"
          >
            {isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
