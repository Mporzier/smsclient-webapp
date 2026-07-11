"use client";

import { renderAudienceRoute } from "./routes/audienceRoutes";
import { renderContentRoute } from "./routes/contentRoutes";
import {
  renderDefaultRoute,
  renderSettingsRoute,
} from "./routes/settingsRoutes";
import type { PrototypeAppContext } from "./usePrototypeApp";

type Props = {
  ctx: PrototypeAppContext;
};

export function PrototypeRouteContent({ ctx }: Props) {
  const { route } = ctx;
  return (
    renderAudienceRoute(route, ctx) ??
    renderContentRoute(route, ctx) ??
    renderSettingsRoute(route, ctx) ??
    renderDefaultRoute(ctx)
  );
}
