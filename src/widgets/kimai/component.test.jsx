// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "test-utils/render-with-providers";

const { useWidgetAPI } = vi.hoisted(() => ({
  useWidgetAPI: vi.fn(),
}));

vi.mock("utils/proxy/use-widget-api", () => ({
  default: useWidgetAPI,
}));

import Component from "./component";

describe("widgets/kimai/component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders placeholders while loading", () => {
    useWidgetAPI.mockReturnValue({ data: undefined, error: undefined });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "kimai" } }} />, {
      settings: { hideErrors: false },
    });

    expect(container.querySelectorAll(".service-block")).toHaveLength(3);
    expect(screen.getByText("kimai.active")).toBeInTheDocument();
    expect(screen.getByText("kimai.today")).toBeInTheDocument();
    expect(screen.getByText("kimai.week")).toBeInTheDocument();
  });

  it("renders error UI when any request errors", () => {
    useWidgetAPI
      .mockReturnValueOnce({ data: undefined, error: { message: "nope" } })
      .mockReturnValueOnce({ data: undefined, error: undefined })
      .mockReturnValueOnce({ data: undefined, error: undefined });

    renderWithProviders(<Component service={{ widget: { type: "kimai" } }} />, { settings: { hideErrors: false } });

    expect(screen.getAllByText(/widget\.api_error/i).length).toBeGreaterThan(0);
  });

  it("sums timesheet durations into hours and shows the active timer", () => {
    useWidgetAPI
      .mockReturnValueOnce({ data: [{ duration: 3600 }, { duration: 1800 }], error: undefined })
      .mockReturnValueOnce({ data: [{ duration: 7200 }, { duration: 3600 }], error: undefined })
      .mockReturnValueOnce({
        data: [
          {
            begin: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            project: { name: "Lighting Design" },
            activity: { name: "Programming" },
          },
        ],
        error: undefined,
      });

    renderWithProviders(<Component service={{ widget: { type: "kimai" } }} />, { settings: { hideErrors: false } });

    expect(screen.getByText(/Lighting Design/)).toBeInTheDocument();
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
    expect(screen.getByText("3h")).toBeInTheDocument();
  });

  it("shows idle when no timer is active", () => {
    useWidgetAPI
      .mockReturnValueOnce({ data: [], error: undefined })
      .mockReturnValueOnce({ data: [], error: undefined })
      .mockReturnValueOnce({ data: [], error: undefined });

    renderWithProviders(<Component service={{ widget: { type: "kimai" } }} />, { settings: { hideErrors: false } });

    expect(screen.getByText("kimai.idle")).toBeInTheDocument();
  });

  it("asks for the same range on every render within a day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 17, 21, 10, 5));
    useWidgetAPI.mockReturnValue({ data: undefined, error: undefined });
    const service = { widget: { type: "kimai" } };

    renderWithProviders(<Component service={service} />, { settings: { hideErrors: false } });
    vi.setSystemTime(new Date(2026, 10, 17, 21, 10, 7));
    renderWithProviders(<Component service={service} />, { settings: { hideErrors: false } });
    vi.useRealTimers();

    const [today, week] = useWidgetAPI.mock.calls.slice(0, 2).map((call) => call[2]);
    const [todayAgain, weekAgain] = useWidgetAPI.mock.calls.slice(3, 5).map((call) => call[2]);
    expect(today).toEqual({ begin: "2026-11-17T00:00:00", end: "2026-11-17T23:59:59", size: 200 });
    expect(week).toEqual({ begin: "2026-11-16T00:00:00", end: "2026-11-17T23:59:59", size: 200 });
    expect(todayAgain).toEqual(today);
    expect(weekAgain).toEqual(week);
  });
});
