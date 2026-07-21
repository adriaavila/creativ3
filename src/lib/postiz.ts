// Server-side client for the Postiz public API (social scheduling + analytics).
// Auth: raw API key in the Authorization header. https://docs.postiz.com/public-api

export type PostizMetric = {
  label: string;
  value: number;
  percentageChange: number;
  points: { date: string; total: number }[];
};

export type PostizChannel = {
  id: string;
  name: string;
  identifier: string; // "instagram" | "linkedin" | ...
  picture: string | null;
  disabled: boolean;
  metrics: PostizMetric[];
};

export type PostizPost = {
  id: string;
  content: string;
  publishDate: string;
  state: string; // QUEUE | PUBLISHED | DRAFT | ERROR
  releaseURL: string | null;
  integration: { id: string; name: string; identifier: string } | null;
};

export type MarketingSnapshot = {
  configured: boolean;
  error: string | null;
  channels: PostizChannel[];
  posts: PostizPost[];
  fetchedAt: string;
};

const API_URL = process.env.POSTIZ_API_URL ?? "https://api.postiz.com";

export function isPostizConfigured() {
  return Boolean(process.env.POSTIZ_API_KEY);
}

async function postizFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "content-type": "application/json",
      authorization: process.env.POSTIZ_API_KEY as string,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Postiz ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  return response.json() as Promise<T>;
}

type RawMetric = { label?: string; percentageChange?: number; data?: { date?: string; total?: string | number }[] };

function normalizeMetrics(raw: unknown): PostizMetric[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawMetric[]).map((metric) => {
    const points = (metric.data ?? []).map((point) => ({
      date: String(point.date ?? ""),
      total: Number(point.total ?? 0),
    }));
    // ponytail: followers are a cumulative snapshot (take last), the rest are daily flows (sum).
    const cumulative = /follower|seguidor|subscriber|suscriptor|fan|member|conexion|connection/i.test(metric.label ?? "");
    const value = cumulative ? (points.at(-1)?.total ?? 0) : points.reduce((sum, point) => sum + point.total, 0);
    return {
      label: String(metric.label ?? ""),
      value,
      percentageChange: Number(metric.percentageChange ?? 0),
      points,
    };
  });
}

export async function getPostAnalytics(postId: string, days = 30): Promise<{ missing: boolean; metrics: PostizMetric[] }> {
  const raw = await postizFetch<unknown>(`/public/v1/analytics/post/${postId}?date=${days}`);
  if (raw && typeof raw === "object" && "missing" in raw && (raw as { missing: boolean }).missing) {
    return { missing: true, metrics: [] };
  }
  return { missing: false, metrics: normalizeMetrics(raw) };
}

export async function getMarketingSnapshot(days = 30): Promise<MarketingSnapshot> {
  const fetchedAt = new Date().toISOString();
  if (!isPostizConfigured()) {
    return { configured: false, error: null, channels: [], posts: [], fetchedAt };
  }

  try {
    const startDate = new Date(Date.now() - days * 86_400_000).toISOString();
    const endDate = new Date(Date.now() + 14 * 86_400_000).toISOString();

    const [integrationsRaw, postsRaw] = await Promise.all([
      postizFetch<unknown>("/public/v1/integrations"),
      postizFetch<unknown>(`/public/v1/posts?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`),
    ]);

    const integrations = (Array.isArray(integrationsRaw) ? integrationsRaw : []) as Record<string, unknown>[];
    const channels = await Promise.all(
      integrations.map(async (integration): Promise<PostizChannel> => {
        const id = String(integration.id);
        let metrics: PostizMetric[] = [];
        try {
          metrics = normalizeMetrics(await postizFetch<unknown>(`/public/v1/analytics/${id}?date=${days}`));
        } catch {
          // channel without analytics support — show it anyway
        }
        return {
          id,
          name: String(integration.name ?? id),
          identifier: String(integration.identifier ?? integration.providerIdentifier ?? ""),
          picture: integration.picture ? String(integration.picture) : null,
          disabled: Boolean(integration.disabled),
          metrics,
        };
      }),
    );

    const postList = Array.isArray(postsRaw)
      ? postsRaw
      : ((postsRaw as { posts?: unknown[] })?.posts ?? []);
    const posts = (postList as Record<string, unknown>[]).map((post): PostizPost => {
      const integration = post.integration as Record<string, unknown> | undefined;
      return {
        id: String(post.id),
        content: String(post.content ?? ""),
        publishDate: String(post.publishDate ?? post.createdAt ?? ""),
        state: String(post.state ?? "QUEUE"),
        releaseURL: post.releaseURL ? String(post.releaseURL) : null,
        integration: integration
          ? {
              id: String(integration.id),
              name: String(integration.name ?? ""),
              identifier: String(integration.providerIdentifier ?? integration.identifier ?? ""),
            }
          : null,
      };
    });
    posts.sort((a, b) => b.publishDate.localeCompare(a.publishDate));

    return { configured: true, error: null, channels, posts, fetchedAt };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "Error consultando Postiz",
      channels: [],
      posts: [],
      fetchedAt,
    };
  }
}
