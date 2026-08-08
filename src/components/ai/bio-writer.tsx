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
import { useCompletion } from '@ai-sdk/react';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';

const TONES = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Profissional' },
  { value: 'creative', label: 'Criativo' },
  { value: 'minimal', label: 'Minimalista' },
] as const;

export default function BioWriter({
  name,
  links,
  onGenerated,
  children,
}: {
  name: string;
  links?: string[];
  onGenerated: (bio: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<(typeof TONES)[number]['value']>('casual');
  const [context, setContext] = useState('');

  const { completion, isLoading, complete } = useCompletion({
    api: '/api/ai/generate',
    onError: (err) => {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    complete('generate', {
      body: { type: 'bio', name, links, tone, context: context || undefined },
    });
  };

  const handleApply = () => {
    onGenerated(completion);
    setOpen(false);
    toast({
      title: 'Bio atualizada!',
      description: 'Sua bio gerada por IA foi aplicada.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-cal text-xl">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Assistente de Bio com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-medium text-sm">Tom</Label>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-colors ${
                    tone === t.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-context" className="font-medium text-sm">
              Conte-nos sobre você{' '}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Input
              id="ai-context"
              placeholder="ex: desenvolvedor, fotógrafo, baseado em São Paulo..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Gerando...' : 'Gerar Bio'}
          </Button>

          {completion && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-sm leading-relaxed">{completion}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleGenerate}
                  disabled={isLoading}
                >
                  Gerar Novamente
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleApply}
                  disabled={isLoading}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
