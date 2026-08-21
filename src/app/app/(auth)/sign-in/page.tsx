'use client';

import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';
import OpenBioLogo from '@/public/openbio.png';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type SyntheticEvent, useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? 'Algo deu errado');
      setLoading(false);
      return;
    }
    router.push('/app');
  };

  return (
    <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
      <div className="mb-8 flex flex-col items-center">
        <Link href="/">
          <Image src={OpenBioLogo} alt="OpenBio" width={48} height={48} />
        </Link>
        <h1 className="mt-4 font-cal text-2xl">Bem-vindo de volta</h1>
        <p className="mt-1 text-muted-foreground text-sm">Entre na sua conta</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@exemplo.com"
            className="h-11 rounded-xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="h-11 rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm">
            {error}
          </p>
        )}
        <GradientButton
          type="submit"
          disabled={loading}
          className="mt-1 w-full"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
        </GradientButton>
      </form>
    </div>
  );
}
