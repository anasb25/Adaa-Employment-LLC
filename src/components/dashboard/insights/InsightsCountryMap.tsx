import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import type { MapObject } from "@react-jvectormap/core/dist/types";
import { CountryInsightRow } from "../../../types/dashboard";

type InsightsCountryMapProps = {
  rows: CountryInsightRow[];
};

type MarkerLabel = {
  key: string;
  count: number;
  x: number;
  y: number;
};

function markerRadius(count: number, max: number): number {
  const minRadius = String(count).length > 2 ? 16 : 14;
  if (max <= 0) return minRadius;
  return minRadius + Math.round((count / max) * 6);
}

export default function InsightsCountryMap({ rows }: InsightsCountryMapProps) {
  const mapRef = useRef<MapObject | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mappedRef = useRef<CountryInsightRow[]>([]);
  const [labels, setLabels] = useState<MarkerLabel[]>([]);

  const mapped = useMemo(
    () => rows.filter((row) => row.isoCode && row.lat != null && row.lng != null),
    [rows],
  );
  mappedRef.current = mapped;

  const isoCodes = useMemo(
    () => mapped.map((row) => row.isoCode).filter((code): code is string => Boolean(code)),
    [mapped],
  );
  const maxCount = useMemo(
    () => mapped.reduce((max, row) => Math.max(max, row.count), 0),
    [mapped],
  );
  const byIso = useMemo(() => {
    const values: Record<string, CountryInsightRow> = {};
    for (const row of mapped) {
      if (row.isoCode) values[row.isoCode] = row;
    }
    return values;
  }, [mapped]);

  const markers = useMemo(
    () =>
      mapped.map((row) => ({
        latLng: [row.lat as number, row.lng as number],
        name: row.country,
        style: {
          fill: "#465FFF",
          stroke: "#FFFFFF",
          strokeWidth: 1,
          fillOpacity: 1,
          r: markerRadius(row.count, maxCount),
        },
      })),
    [mapped, maxCount],
  );

  const seriesValues = useMemo(() => {
    const values: Record<string, number> = {};
    for (const row of mapped) {
      if (row.isoCode) values[row.isoCode] = row.count;
    }
    return values;
  }, [mapped]);

  const series = useMemo(
    () => ({
      regions: [
        {
          attribute: "fill" as const,
          values: seriesValues,
          scale: ["#C7D7FE", "#465FFF"],
          normalizeFunction: "polynomial" as const,
        },
      ],
    }),
    [seriesValues],
  );

  const syncLabels = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;

    const circles = root.querySelectorAll("circle.jvectormap-marker");
    const next: MarkerLabel[] = [];

    circles.forEach((circle) => {
      const index = Number(circle.getAttribute("data-index"));
      const row = mappedRef.current[index];
      const x = Number(circle.getAttribute("cx"));
      const y = Number(circle.getAttribute("cy"));
      if (!row || Number.isNaN(x) || Number.isNaN(y)) return;

      next.push({
        key: row.isoCode || `${row.country}-${index}`,
        count: row.count,
        x,
        y,
      });
    });

    setLabels(next);
  }, []);

  useEffect(() => {
    if (!mapRef.current || isoCodes.length === 0) {
      syncLabels();
      return;
    }

    const focus =
      isoCodes.length === 1
        ? { region: isoCodes[0], scale: 4, animate: true }
        : { regions: isoCodes, animate: true };

    const frame = window.requestAnimationFrame(() => {
      mapRef.current?.setFocus(focus);
      syncLabels();
    });
    const timeout = window.setTimeout(syncLabels, 450);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [isoCodes, syncLabels]);

  const onViewportChange = useCallback(() => {
    syncLabels();
  }, [syncLabels]);

  const onRegionTipShow = useCallback(
    (_event: unknown, el: { html?: (value: string) => void }, code: string) => {
      const row = byIso[code];
      if (row && el.html) {
        el.html(`${row.country}: ${row.count.toLocaleString()} employees`);
      }
    },
    [byIso],
  );

  const onMarkerTipShow = useCallback(
    (_event: unknown, el: { html?: (value: string) => void }, index: string) => {
      const row = mapped[Number(index)];
      if (row && el.html) {
        el.html(`${row.country}: ${row.count.toLocaleString()} employees`);
      }
    },
    [mapped],
  );

  const regionStyle = useMemo(
    () => ({
      initial: {
        fill: "#D0D5DD",
        fillOpacity: 1,
        stroke: "none",
        strokeWidth: 0,
      },
      hover: {
        fillOpacity: 0.85,
        cursor: "pointer",
        fill: "#465FFF",
      },
    }),
    [],
  );

  const markerStyle = useMemo(
    () => ({
      initial: {
        fill: "#465FFF",
        r: 14,
      },
    }),
    [],
  );

  if (mapped.length === 0) {
    return (
      <div className="flex h-full min-h-[22rem] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No country locations to plot for this period.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="insights-country-map relative h-[420px] w-full overflow-hidden">
      <VectorMap
        map={worldMill}
        mapRef={mapRef}
        className="h-full w-full"
        backgroundColor="transparent"
        zoomOnScroll
        panOnDrag
        zoomMax={12}
        zoomMin={1}
        zoomAnimate
        zoomStep={1.5}
        markers={markers}
        series={series}
        onViewportChange={onViewportChange}
        onRegionTipShow={onRegionTipShow}
        onMarkerTipShow={onMarkerTipShow}
        regionStyle={regionStyle}
        markerStyle={markerStyle as never}
      />
      <div className="pointer-events-none absolute inset-0 z-[1]">
        {labels.map((label) => (
          <span
            key={label.key}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center font-bold leading-none text-white"
            style={{
              left: label.x,
              top: label.y,
              fontSize: String(label.count).length > 2 ? 10 : 11,
            }}
          >
            {label.count.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}
