'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import {
  Copy,
  Cpu,
  Download,
  Eye,
  Globe,
  Mail,
  MapPin,
  Megaphone,
  Monitor,
  MousePointerClick,
  Target,
  Users,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

const viewsConfig = {
  views: {
    label: 'Visualizações',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const clicksConfig = {
  clicks: {
    label: 'Cliques',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
}

type UtmBreakdownRow = {
  source: string;
  medium: string;
  campaign: string;
  count: number;
};

function CampaignsCard({ data }: { data: UtmBreakdownRow[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-cal">Campanhas</CardTitle>
        <CardDescription>Tráfego por campanha UTM</CardDescription>
      </CardHeader>
      <CardContent>
        {data?.length ? (
          <div className="space-y-3">
            {data.map((u) => {
              const maxCount = data[0]?.count ?? 1;
              const pct = Math.round((u.count / maxCount) * 100);
              const key = `${u.source}:${u.medium}:${u.campaign}`;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate">{u.campaign}</span>
                        <span className="block truncate text-muted-foreground text-xs">
                          {u.source} / {u.medium}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {u.count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-chart-1 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Ainda não há dados de campanha
          </p>
        )}
      </CardContent>
    </Card>
  );
}

type TrafficSourceRow = { source: string; count: number };

function AdTrafficSourceCard({
  data,
}: {
  data: TrafficSourceRow[] | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-cal">
          Origem do Tráfego de Anúncios
        </CardTitle>
        <CardDescription>Visitantes de cliques em anúncios</CardDescription>
      </CardHeader>
      <CardContent>
        {data?.length ? (
          <div className="space-y-3">
            {data.map((s) => {
              const maxCount = data[0]?.count ?? 1;
              const pct = Math.round((s.count / maxCount) * 100);
              return (
                <div key={s.source} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                      {s.source}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {s.count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-chart-2 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Ainda não há dados de tráfego de anúncios
          </p>
        )}
      </CardContent>
    </Card>
  );
}

type LocationBreakdownRow = {
  country: string;
  region: string;
  city: string;
  count: number;
};

function TopLocationsCard({
  data,
}: { data: LocationBreakdownRow[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-cal">Principais Localizações</CardTitle>
        <CardDescription>Localização dos visitantes por cidade</CardDescription>
      </CardHeader>
      <CardContent>
        {data?.length ? (
          <div className="space-y-3">
            {data.map((l) => {
              const maxCount = data[0]?.count ?? 1;
              const pct = Math.round((l.count / maxCount) * 100);
              const key = `${l.country}:${l.region}:${l.city}`;
              const label = [l.city, l.region, l.country]
                .filter((part) => part && part !== 'Unknown')
                .join(', ');
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {label || 'Desconhecido'}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {l.count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-chart-4 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Ainda não há dados de localização
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics({ linkId }: { linkId: string }) {
  const { data, isLoading } = api.profileLink.analytics.useQuery({
    linkId,
    days: 30,
  });

  const { data: subscribers } = api.profileLink.subscribers.useQuery({
    linkId,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-[250px] animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const viewsData = data.viewsOverTime.map((v) => ({
    date: formatDate(v.date),
    views: v.count,
  }));

  const clicksData = data.clicksOverTime.map((c) => ({
    date: formatDate(c.date),
    clicks: c.count,
  }));

  return (
    <div className="grid gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total de Visualizações
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-cal text-3xl">{data.views}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Visualizações Únicas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-cal text-3xl">{data.uniqueViews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total de Cliques
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-cal text-3xl">{data.clicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Taxa de Cliques
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-cal text-3xl">
              {data.views > 0
                ? `${Math.round((data.clicks / data.views) * 100)}%`
                : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Views over time */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cal">Visualizações</CardTitle>
          <CardDescription>
            Visualizações do perfil nos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewsData.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">
              Ainda não há dados de visualização
            </p>
          ) : (
            <ChartContainer config={viewsConfig} className="h-[250px] w-full">
              <AreaChart data={viewsData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  fill="var(--color-views)"
                  fillOpacity={0.2}
                  stroke="var(--color-views)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Clicks over time */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cal">Cliques</CardTitle>
          <CardDescription>
            Cliques nos cards nos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clicksData.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">
              Ainda não há dados de cliques
            </p>
          ) : (
            <ChartContainer config={clicksConfig} className="h-[250px] w-full">
              <AreaChart data={clicksData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  fill="var(--color-clicks)"
                  fillOpacity={0.2}
                  stroke="var(--color-clicks)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top cards + referrers side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top clicked cards */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Principais Links</CardTitle>
            <CardDescription>
              Cards mais clicados, com taxa de cliques (% de visitantes que
              clicaram)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.cardStats.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                Ainda não há dados de cliques
              </p>
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {data.cardStats.map((c) => {
                  const maxCount = data.cardStats[0]?.clicks ?? 1;
                  const pct = Math.round((c.clicks / maxCount) * 100);
                  let label: string;
                  try {
                    const url = new URL(c.href);
                    label = url.hostname.replace('www.', '') + url.pathname;
                  } catch {
                    label = c.href;
                  }
                  return (
                    <div key={c.bentoId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{label}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {c.clicks} · {Math.round(c.ctr * 100)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-3 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">
              Principais Referenciadores
            </CardTitle>
            <CardDescription>De onde vêm seus visitantes</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topReferrers.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                Ainda não há dados de referenciadores
              </p>
            ) : (
              <div className="space-y-3">
                {data.topReferrers.map((r) => {
                  const maxCount = data.topReferrers[0]?.count ?? 1;
                  const pct = Math.round((r.count / maxCount) * 100);
                  let label = r.referrer;
                  try {
                    if (label !== 'Direto') {
                      label = new URL(label).hostname.replace('www.', '');
                    }
                  } catch {
                    // keep raw label
                  }
                  return (
                    <div key={r.referrer} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{label}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {r.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Devices, OS, Browsers & Geography */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Dispositivos</CardTitle>
            <CardDescription>
              Tipos de dispositivo dos visitantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.deviceBreakdown?.devices?.length ? (
              <div className="space-y-3">
                {data.deviceBreakdown.devices.map((d) => {
                  const maxCount = data.deviceBreakdown.devices[0]?.count ?? 1;
                  const pct = Math.round((d.count / maxCount) * 100);
                  return (
                    <div key={d.device} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 capitalize">
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          {d.device}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {d.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-4 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">
                Ainda não há dados de dispositivos
              </p>
            )}
          </CardContent>
        </Card>

        {/* Operating System */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Sistema Operacional</CardTitle>
            <CardDescription>
              Android, iOS, Windows, macOS, Linux...
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.deviceBreakdown?.os?.length ? (
              <div className="space-y-3">
                {data.deviceBreakdown.os.map((o) => {
                  const maxCount = data.deviceBreakdown.os[0]?.count ?? 1;
                  const pct = Math.round((o.count / maxCount) * 100);
                  return (
                    <div key={o.os} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 truncate">
                          <Cpu className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {o.os}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {o.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-3 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">
                Ainda não há dados de sistema operacional
              </p>
            )}
          </CardContent>
        </Card>

        {/* Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Navegadores</CardTitle>
            <CardDescription>Navegadores dos visitantes</CardDescription>
          </CardHeader>
          <CardContent>
            {data.deviceBreakdown?.browsers?.length ? (
              <div className="space-y-3">
                {data.deviceBreakdown.browsers.map((b) => {
                  const maxCount = data.deviceBreakdown.browsers[0]?.count ?? 1;
                  const pct = Math.round((b.count / maxCount) * 100);
                  return (
                    <div key={b.browser} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{b.browser}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {b.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-5 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">
                Ainda não há dados de navegadores
              </p>
            )}
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Países</CardTitle>
            <CardDescription>Localização dos visitantes</CardDescription>
          </CardHeader>
          <CardContent>
            {data.geoBreakdown?.length ? (
              <div className="space-y-3">
                {data.geoBreakdown.map((g) => {
                  const maxCount = data.geoBreakdown[0]?.count ?? 1;
                  const pct = Math.round((g.count / maxCount) * 100);
                  return (
                    <div key={g.country} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {g.country}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {g.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">
                Ainda não há dados de localização
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaigns, Ad Traffic Source & Top Locations */}
      <div className="grid gap-6 md:grid-cols-3">
        <CampaignsCard data={data.utmBreakdown} />
        <AdTrafficSourceCard data={data.trafficSourceBreakdown} />
        <TopLocationsCard data={data.locationBreakdown} />
      </div>

      {/* Email Subscribers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-cal">Inscritos</CardTitle>
            <CardDescription>
              {subscribers?.length ?? 0} e-mail{' '}
              {subscribers?.length === 1 ? 'inscrito' : 'inscritos'}
            </CardDescription>
          </div>
          {subscribers && subscribers.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const emails = subscribers.map((s) => s.email).join(', ');
                  navigator.clipboard
                    .writeText(emails)
                    .then(() => {
                      toast({
                        title: 'Copiado!',
                        description: `${subscribers.length} e-mails copiados para a área de transferência.`,
                      });
                    })
                    .catch(() => undefined);
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copiar tudo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csv = ['Email,Date']
                    .concat(
                      subscribers.map(
                        (s) =>
                          `${s.email},${new Date(s.createdAt).toLocaleDateString()}`
                      )
                    )
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'subscribers.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Exportar CSV
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {subscribers?.length ? (
            <div className="space-y-2">
              {subscribers.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span className="truncate text-sm">{s.email}</span>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                Ainda não há inscritos. Adicione um card de Coleta de E-mail ao
                seu perfil.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
