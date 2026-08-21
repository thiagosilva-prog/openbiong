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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import {
  Copy,
  Cpu,
  Download,
  Eye,
  Globe,
  Mail,
  Megaphone,
  Monitor,
  MousePointerClick,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

const trafficConfig = {
  views: {
    label: 'Visualizações',
    color: 'var(--chart-1)',
  },
  clicks: {
    label: 'Cliques',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const DAY_OPTIONS = [7, 30, 90] as const;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
}

type Trend = { pct: number; isUp: boolean; isNew: boolean };

function computeTrend(current: number, previous: number): Trend | null {
  if (previous === 0) {
    return current > 0 ? { pct: 0, isUp: true, isNew: true } : null;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct, isUp: pct >= 0, isNew: false };
}

function TrendBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const trend = computeTrend(current, previous);
  if (!trend) {
    return null;
  }
  const Icon = trend.isUp ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-medium text-xs',
        trend.isUp
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400'
      )}
    >
      <Icon className="h-3 w-3" />
      {trend.isNew ? 'novo' : `${trend.pct > 0 ? '+' : ''}${trend.pct}%`}
    </span>
  );
}

type BreakdownItem = { label: string; count: number };

function BreakdownList({
  items,
  colorClass,
  emptyText,
  icon: Icon,
  capitalize,
}: {
  items: BreakdownItem[] | undefined;
  colorClass: string;
  emptyText: string;
  icon?: ComponentType<{ className?: string }>;
  capitalize?: boolean;
}) {
  if (!items?.length) {
    return (
      <p className="py-6 text-center text-muted-foreground text-sm">
        {emptyText}
      </p>
    );
  }
  const maxCount = items[0]?.count ?? 1;
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = Math.round((item.count / maxCount) * 100);
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span
                className={cn(
                  'flex min-w-0 items-center gap-1.5',
                  capitalize && 'capitalize'
                )}
              >
                {Icon && (
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {item.count}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full transition-all', colorClass)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type DeviceBreakdown = {
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  os: { os: string; count: number }[];
};

function DeviceTabsCard({ data }: { data: DeviceBreakdown | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-cal">Dispositivo & Navegador</CardTitle>
        <CardDescription>Como seus visitantes acessam</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="device">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="device">Dispositivo</TabsTrigger>
            <TabsTrigger value="os">Sistema</TabsTrigger>
            <TabsTrigger value="browser">Navegador</TabsTrigger>
          </TabsList>
          <TabsContent value="device">
            <BreakdownList
              items={data?.devices.map((d) => ({
                label: d.device,
                count: d.count,
              }))}
              icon={Monitor}
              colorClass="bg-chart-4"
              emptyText="Ainda não há dados de dispositivos"
              capitalize
            />
          </TabsContent>
          <TabsContent value="os">
            <BreakdownList
              items={data?.os.map((o) => ({ label: o.os, count: o.count }))}
              icon={Cpu}
              colorClass="bg-chart-3"
              emptyText="Ainda não há dados de sistema operacional"
            />
          </TabsContent>
          <TabsContent value="browser">
            <BreakdownList
              items={data?.browsers.map((b) => ({
                label: b.browser,
                count: b.count,
              }))}
              colorClass="bg-chart-5"
              emptyText="Ainda não há dados de navegadores"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

type LocationBreakdownRow = {
  country: string;
  count: number;
  cities: { city: string; region: string; count: number }[];
};

function LocationCard({ data }: { data: LocationBreakdownRow[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-cal">Localização</CardTitle>
        <CardDescription>De onde seus visitantes acessam</CardDescription>
      </CardHeader>
      <CardContent>
        {data?.length ? (
          <div className="space-y-4">
            {data.map((l) => {
              const maxCount = data[0]?.count ?? 1;
              const pct = Math.round((l.count / maxCount) * 100);
              return (
                <div key={l.country} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{l.country}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {l.count}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {l.cities.length > 0 && (
                    <p className="truncate pl-5 text-muted-foreground text-xs">
                      {l.cities.map((c) => c.city).join(' · ')}
                    </p>
                  )}
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

type TrafficSourceRow = { source: string; count: number };
type UtmBreakdownRow = {
  source: string;
  medium: string;
  campaign: string;
  count: number;
};

function TrafficCard({
  sourceData,
  campaignData,
}: {
  sourceData: TrafficSourceRow[] | undefined;
  campaignData: UtmBreakdownRow[] | undefined;
}) {
  // Rows with no UTM tag at all just restate what the source breakdown
  // above already shows ("(não definido)" / "Direto") — only real, tagged
  // campaigns are worth a second list here.
  const taggedCampaigns = campaignData?.filter(
    (u) => u.campaign !== '(não definido)'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-cal">Tráfego</CardTitle>
        <CardDescription>De onde vêm os visitantes e cliques</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <BreakdownList
          items={sourceData?.map((s) => ({ label: s.source, count: s.count }))}
          icon={Megaphone}
          colorClass="bg-chart-2"
          emptyText="Ainda não há dados de tráfego"
        />
        {taggedCampaigns && taggedCampaigns.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Campanhas UTM
            </p>
            {taggedCampaigns.map((u) => {
              const maxCount = taggedCampaigns[0]?.count ?? 1;
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
        )}
      </CardContent>
    </Card>
  );
}

type OverTimeRow = { date: string; count: number };

function buildChartData(
  viewsOverTime: OverTimeRow[],
  clicksOverTime: OverTimeRow[]
) {
  const byDate = new Map<
    string,
    { date: string; views: number; clicks: number }
  >();
  for (const v of viewsOverTime) {
    byDate.set(v.date, { date: formatDate(v.date), views: v.count, clicks: 0 });
  }
  for (const c of clicksOverTime) {
    const existing = byDate.get(c.date);
    if (existing) {
      existing.clicks = c.count;
    } else {
      byDate.set(c.date, {
        date: formatDate(c.date),
        views: 0,
        clicks: c.count,
      });
    }
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, v]) => v);
}

function rateOf(clicks: number, views: number) {
  return views > 0 ? clicks / views : 0;
}

export default function Analytics({ linkId }: { linkId: string }) {
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(30);

  const { data, isLoading } = api.profileLink.analytics.useQuery({
    linkId,
    days,
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

  const chartData = buildChartData(data.viewsOverTime, data.clicksOverTime);

  const currentRate = rateOf(
    data.periodComparison.clicks.current,
    data.periodComparison.views.current
  );
  const previousRate = rateOf(
    data.periodComparison.clicks.previous,
    data.periodComparison.views.previous
  );

  return (
    <div className="grid gap-6">
      {/* Period selector */}
      <div className="flex items-center justify-end gap-2">
        {DAY_OPTIONS.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={days === d ? 'default' : 'outline'}
            onClick={() => setDays(d)}
          >
            {d} dias
          </Button>
        ))}
      </div>

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
            <div className="flex items-baseline gap-2">
              <div className="font-cal text-3xl">{data.views}</div>
              <TrendBadge
                current={data.periodComparison.views.current}
                previous={data.periodComparison.views.previous}
              />
            </div>
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
            <div className="flex items-baseline gap-2">
              <div className="font-cal text-3xl">{data.uniqueViews}</div>
              <TrendBadge
                current={data.periodComparison.uniqueViews.current}
                previous={data.periodComparison.uniqueViews.previous}
              />
            </div>
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
            <div className="flex items-baseline gap-2">
              <div className="font-cal text-3xl">{data.clicks}</div>
              <TrendBadge
                current={data.periodComparison.clicks.current}
                previous={data.periodComparison.clicks.previous}
              />
            </div>
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
            <div className="flex items-baseline gap-2">
              <div className="font-cal text-3xl">
                {data.views > 0
                  ? `${Math.round((data.clicks / data.views) * 100)}%`
                  : '0%'}
              </div>
              <TrendBadge
                current={Math.round(currentRate * 1000)}
                previous={Math.round(previousRate * 1000)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Views + clicks over time, combined */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cal">Visualizações & Cliques</CardTitle>
          <CardDescription>
            Atividade do perfil nos últimos {days} dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">
              Ainda não há dados de atividade
            </p>
          ) : (
            <ChartContainer config={trafficConfig} className="h-[280px] w-full">
              <AreaChart data={chartData}>
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
                  let urlLabel: string;
                  try {
                    const url = new URL(c.href);
                    urlLabel = url.hostname.replace('www.', '') + url.pathname;
                  } catch {
                    urlLabel = c.href;
                  }
                  return (
                    <div key={c.href} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{c.title ?? urlLabel}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {c.clicks} · {Math.round(c.ctr * 100)}%
                        </span>
                      </div>
                      {c.title && (
                        <p className="truncate text-muted-foreground text-xs">
                          {urlLabel}
                        </p>
                      )}
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

      {/* Device/OS/Browser, Location & Traffic */}
      <div className="grid gap-6 md:grid-cols-3">
        <DeviceTabsCard data={data.deviceBreakdown} />
        <LocationCard data={data.locationBreakdown} />
        <TrafficCard
          sourceData={data.trafficSourceBreakdown}
          campaignData={data.utmBreakdown}
        />
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
