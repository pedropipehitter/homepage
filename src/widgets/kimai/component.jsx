import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

function toKimaiDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function startOfToday(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(now) {
  const d = startOfToday(now);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function payPeriodStart(now, anchorIso, length) {
  if (!anchorIso) return startOfWeek(now);

  const anchor = new Date(anchorIso);
  if (Number.isNaN(anchor.getTime())) return startOfWeek(now);
  anchor.setHours(0, 0, 0, 0);

  if (length === "monthly") {
    const candidate = new Date(now.getFullYear(), now.getMonth(), anchor.getDate());
    candidate.setHours(0, 0, 0, 0);
    if (candidate > now) candidate.setMonth(candidate.getMonth() - 1);
    return candidate;
  }

  const days = length === "weekly" ? 7 : length === "biweekly" ? 14 : Number.parseInt(length, 10) || 14;
  if (now < anchor) return anchor;
  const elapsedDays = Math.floor((startOfToday(now) - anchor) / (24 * 60 * 60 * 1000));
  const periods = Math.floor(elapsedDays / days);
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + periods * days);
  start.setHours(0, 0, 0, 0);
  return start;
}

function sumDurationSeconds(entries) {
  if (!Array.isArray(entries)) return 0;
  return entries.reduce((acc, e) => acc + (typeof e.duration === "number" ? e.duration : 0), 0);
}

function formatHours(t, seconds) {
  if (seconds <= 0) return "0m";
  return t("common.duration", { value: seconds });
}

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;
  const now = new Date();

  const todayBegin = toKimaiDateTime(startOfToday(now));
  const weekBegin = toKimaiDateTime(startOfWeek(now));
  const periodBegin = toKimaiDateTime(payPeriodStart(now, widget.payPeriodStart, widget.payPeriodLength));
  const end = toKimaiDateTime(now);

  const { data: todayData, error: todayError } = useWidgetAPI(widget, "timesheets", {
    begin: todayBegin,
    end,
    size: 200,
  });

  const { data: weekData, error: weekError } = useWidgetAPI(widget, "timesheets", {
    begin: weekBegin,
    end,
    size: 200,
  });

  const { data: periodData, error: periodError } = useWidgetAPI(widget, "timesheets", {
    begin: periodBegin,
    end,
    size: 500,
  });

  const { data: activeData, error: activeError } = useWidgetAPI(widget, "active");

  if (todayError || weekError || periodError || activeError) {
    return <Container service={service} error={todayError ?? weekError ?? periodError ?? activeError} />;
  }

  if (!todayData || !weekData || !periodData || !activeData) {
    return (
      <Container service={service}>
        <Block label="kimai.active" />
        <Block label="kimai.today" />
        <Block label="kimai.week" />
        <Block label="kimai.payPeriod" />
      </Container>
    );
  }

  const activeEntry = Array.isArray(activeData) && activeData.length > 0 ? activeData[0] : null;
  let activeValue = t("kimai.idle");
  if (activeEntry) {
    const elapsedSeconds = Math.max(0, Math.floor((now - new Date(activeEntry.begin)) / 1000));
    const projectName = activeEntry.project?.name ?? activeEntry.activity?.name ?? t("kimai.tracking");
    activeValue = `${projectName} · ${t("common.duration", { value: elapsedSeconds })}`;
  }

  return (
    <Container service={service}>
      <Block label="kimai.active" value={activeValue} />
      <Block label="kimai.today" value={formatHours(t, sumDurationSeconds(todayData))} />
      <Block label="kimai.week" value={formatHours(t, sumDurationSeconds(weekData))} />
      <Block label="kimai.payPeriod" value={formatHours(t, sumDurationSeconds(periodData))} />
    </Container>
  );
}
