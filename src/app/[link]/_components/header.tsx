'use client';

import LinkQRModal from '@/components/modals/link-qr-modal';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { type RouterOutputs, api } from '@/trpc/react';
import Highlight from '@tiptap/extension-highlight';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import TiptapUnderline from '@tiptap/extension-underline';
import {
  type Editor,
  EditorContent,
  type Extension,
  useEditor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Eye,
  Monitor,
  PenLine,
  QrCode,
  Share2,
  Smartphone,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import ProfileLinkAvatar from './avatar';
import BioToolbar from './bio-toolbar';
import { usePreview } from './preview-context';

type ContentAlign = 'left' | 'center' | 'right';
type ProfileLinkData = NonNullable<RouterOutputs['profileLink']['getByLink']>;

function OwnerControls({
  profileLink,
  saving,
}: {
  profileLink: ProfileLinkData;
  saving: boolean;
}) {
  const { preview, setPreview, viewport, setViewport } = usePreview();

  return (
    <div className="flex flex-row flex-wrap items-center justify-end gap-2">
      <Button
        size="sm"
        variant={preview ? 'default' : 'outline'}
        onClick={() => setPreview(!preview)}
        data-tour="preview-toggle"
      >
        {preview ? (
          <>
            <PenLine className="mr-1.5 h-[1.1rem] w-[1.1rem]" />
            Editar
          </>
        ) : (
          <>
            <Eye className="mr-1.5 h-[1.1rem] w-[1.1rem]" />
            Visualizar
          </>
        )}
      </Button>

      {!preview && (
        <>
          <div
            className="hidden items-center rounded-md border border-border md:flex"
            data-tour="viewport-switcher"
          >
            <Button
              size="icon"
              variant={viewport === 'desktop' ? 'default' : 'ghost'}
              className="rounded-r-none"
              onClick={() => setViewport('desktop')}
            >
              <Monitor className="h-[1.2rem] w-[1.2rem]" />
            </Button>
            <Button
              size="icon"
              variant={viewport === 'mobile' ? 'default' : 'ghost'}
              className="rounded-l-none"
              onClick={() => setViewport('mobile')}
            >
              <Smartphone className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </div>

          <Button
            disabled={saving}
            onClick={() => {
              navigator.clipboard
                .writeText(`https://openbio.app/${profileLink.link}`)
                .then(() => {
                  toast({
                    title: 'Copiado para a área de transferência!',
                    description:
                      'Link do perfil copiado para a área de transferência!',
                  });
                })
                .catch(() => undefined);
            }}
          >
            {saving ? 'Salvando...' : 'Compartilhar'}
          </Button>

          <LinkQRModal>
            <Button size="icon" variant="outline" disabled={saving}>
              <QrCode className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </LinkQRModal>
        </>
      )}
    </div>
  );
}

function VisitorControls({ profileLink }: { profileLink: ProfileLinkData }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const url = `https://openbio.app/${profileLink.link}`;
          if (navigator.share) {
            navigator
              .share({
                title: profileLink.name ?? 'Perfil OpenBio',
                url,
              })
              .catch(() => undefined);
          } else {
            navigator.clipboard
              .writeText(url)
              .then(() => {
                toast({
                  title: 'Copiado para a área de transferência!',
                  description: 'Link do perfil copiado!',
                });
              })
              .catch(() => undefined);
          }
        }}
      >
        <Share2 className="mr-1.5 h-4 w-4" />
        Compartilhar
      </Button>
      <LinkQRModal>
        <Button size="icon" variant="outline" className="h-9 w-9">
          <QrCode className="h-4 w-4" />
        </Button>
      </LinkQRModal>
    </div>
  );
}

function ProfileIdentity({
  profileLink,
  contentAlign,
  isEditable,
  name,
  setName,
  editor,
}: {
  profileLink: ProfileLinkData;
  contentAlign: ContentAlign;
  isEditable: boolean;
  name: string | null | undefined;
  setName: (value: string) => void;
  editor: Editor | null;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-y-4',
        contentAlign === 'center' && 'items-center text-center',
        contentAlign === 'right' && 'items-end text-right'
      )}
    >
      {contentAlign !== 'left' && (
        <ProfileLinkAvatar profileLink={profileLink} />
      )}

      <div className="flex items-center gap-x-2">
        <input
          className={cn(
            'min-w-0 shrink bg-transparent font-cal text-3xl text-foreground outline-none focus:outline-none md:text-4xl lg:text-6xl',
            contentAlign === 'center' && 'text-center',
            contentAlign === 'right' && 'text-right'
          )}
          defaultValue={profileLink.name}
          onChange={(e) => setName(e.target.value)}
          readOnly={!isEditable}
          size={Math.max((name ?? profileLink.name ?? '').length, 1)}
        />
      </div>

      <div className="group/bio relative w-full">
        <EditorContent editor={editor} />
        {isEditable && editor && (
          <div
            className={cn(
              'invisible absolute z-40 mt-1 group-focus-within/bio:visible',
              contentAlign === 'right' ? 'right-0' : 'left-0'
            )}
          >
            <BioToolbar
              editor={editor}
              name={profileLink.name ?? ''}
              links={profileLink.bento
                .filter((b) => b.type === 'link' && 'href' in b)
                .map((b) => (b as { href: string }).href)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const extensions = [
  StarterKit.configure({
    link: false,
    underline: false,
  }),
  Placeholder.configure({
    placeholder: 'Conte-nos sobre você!',
    showOnlyWhenEditable: true,
  }),
  TiptapLink.configure({ openOnClick: false }),
  TiptapUnderline,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
] as Extension[];

export default function ProfileLinkHeader({
  profileLink: initialData,
}: { profileLink: ProfileLinkData }) {
  const { link } = useParams<{ link: string }>();

  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    { link },
    { initialData, staleTime: 60_000 }
  );

  const [name, setName] = useState(profileLink?.name);
  const [bio, setBio] = useState(profileLink?.bio);
  const [saving, startSaving] = useTransition();

  const { mutateAsync: updateProfileLink } =
    api.profileLink.update.useMutation();

  useEffect(() => {
    if (!profileLink?.isOwner) {
      return;
    }

    const timer = setTimeout(() => {
      startSaving(async () => {
        await updateProfileLink({
          id: profileLink.id,
          name,
          bio: bio ?? undefined,
        });
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [name, bio, updateProfileLink, profileLink]);

  const { preview } = usePreview();

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: profileLink?.bio,
    editorProps: {
      attributes: {
        class:
          'focus:outline-none dark:prose-invert prose-p:text-foreground prose-headings:font-cal mx-auto lg:prose-lg lg:prose-p:m-0',
      },
    },
    editable: profileLink?.isOwner && !preview,
    onUpdate: ({ editor }) => {
      setBio(editor.getHTML());
    },
  });

  if (!profileLink) {
    return null;
  }

  const isEditable = profileLink.isOwner && !preview;
  const contentAlign =
    (profileLink.contentAlign as 'left' | 'center' | 'right' | undefined) ??
    'left';

  return (
    <div className="flex flex-col gap-y-4" data-tour="profile-header">
      <div
        className={cn(
          'flex items-start',
          contentAlign === 'left' ? 'justify-between' : 'justify-end'
        )}
      >
        {contentAlign === 'left' && (
          <ProfileLinkAvatar profileLink={profileLink} />
        )}

        {profileLink.isOwner ? (
          <OwnerControls profileLink={profileLink} saving={saving} />
        ) : (
          <VisitorControls profileLink={profileLink} />
        )}
      </div>

      <ProfileIdentity
        profileLink={profileLink}
        contentAlign={contentAlign}
        isEditable={isEditable}
        name={name}
        setName={setName}
        editor={editor}
      />
    </div>
  );
}
