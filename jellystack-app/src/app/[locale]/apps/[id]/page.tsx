import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { SERVICES, getService, type ServiceId } from "@/lib/services";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ id: s.id }));
}

function isServiceId(value: string): value is ServiceId {
  return SERVICES.some((s) => s.id === value);
}

export default async function AppIframePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  if (!isServiceId(id)) notFound();

  const svc = getService(id);
  const t = await getTranslations("apps.viewer");
  const proxyUrl = `/proxy/${svc.id}/`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/40 px-6 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">{svc.label}</h1>
          <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
            {svc.category} · http://{svc.id}:{svc.port}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={proxyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-neutral-300 transition hover:bg-neutral-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("openInNewTab")}
          </Link>
        </div>
      </div>
      <div className="flex-1 bg-neutral-950">
        <iframe
          src={proxyUrl}
          title={svc.label}
          className="h-full w-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  );
}
