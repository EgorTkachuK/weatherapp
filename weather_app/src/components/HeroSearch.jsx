import  {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import styled from "styled-components";
import axios from "axios";
import WeatherCard from "./WeatherCard";
import {
  FiSearch,
  FiThermometer,
  FiArrowDown,
  FiArrowUp,
  FiEye,
} from "react-icons/fi";
import { WiHumidity, WiBarometer, WiStrongWind } from "react-icons/wi";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const API_KEY = "6fc404baf425f62aa630cdf9f6cf109f";
const FAVORITES_STORAGE = "weather_favorites_v3";
const APP_USER_KEY = "app_user";

function getFavLimit(
  width = typeof window !== "undefined" ? window.innerWidth : 1200
) {
  if (width < 768) return 1;
  if (width < 1024) return 2;
  return 3;
}

const createAxios = (key) =>
  axios.create({
    baseURL: "https://api.openweathermap.org/data/2.5",
    timeout: 10000,
    params: { appid: API_KEY, units: "metric" },
  });

export default function HeroSearch({ isSignedIn = undefined }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cards, setCards] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [detailsOpenFor, setDetailsOpenFor] = useState(null);
  const [detailsCard, setDetailsCard] = useState(null);
  const [hourlyOpenFor, setHourlyOpenFor] = useState(null);
  const [hourlyCard, setHourlyCard] = useState(null);
  const [hourlyData, setHourlyData] = useState(null);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [hourlyError, setHourlyError] = useState("");

  const [isSignedInLocal, setIsSignedInLocal] = useState(() =>
    typeof isSignedIn === "boolean" ? isSignedIn : false
  );
  const [weeklyOpenFor, setWeeklyOpenFor] = useState(null);
  const [weeklyCard, setWeeklyCard] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState("");

  useEffect(() => {
    if (typeof isSignedIn === "boolean") {
      setIsSignedInLocal(isSignedIn);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (typeof isSignedIn === "boolean") return;
    try {
      const raw = localStorage.getItem(APP_USER_KEY);
      setIsSignedInLocal(Boolean(raw));
    } catch (e) {
      setIsSignedInLocal(false);
    }
  }, [isSignedIn]);

  const axiosInstance = useMemo(() => createAxios(API_KEY), []);
  const cacheRef = useRef(new Map());
  const debounceRef = useRef(null);
  const favLimitRef = useRef(getFavLimit());

  useEffect(() => {
    if (!isSignedInLocal) return;
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const limit = getFavLimit();
      const trimmed = parsed.slice(0, limit);
      const normalized = trimmed
        .map((f) => {
          if (!f || typeof f !== "object") return null;
          const id =
            f.id || (f.name && f.country ? `${f.name}-${f.country}` : null);
          if (!id) return null;
          return {
            id,
            name: f.name || "",
            country: f.country || "",
            temp: f.temp ?? 0,
            description: f.description || "",
            icon: f.icon || null,
            raw: f.raw || null,
            timezone: f.timezone ?? f.raw?.timezone ?? 0,
            fetchedAt: f.fetchedAt || Date.now(),
          };
        })
        .filter(Boolean);
      setFavorites(normalized);
      setCards((prev) => {
        const ids = new Set(prev.map((c) => c.id));
        const toAdd = normalized.filter((f) => !ids.has(f.id));
        return [...toAdd, ...prev];
      });
      normalized.forEach((f) => {
        if (f.name) cacheRef.current.set(f.name.toLowerCase(), f);
      });
    } catch (e) {
      console.error("Failed to load favorites:", e);
    }
  }, [isSignedInLocal]);

  useEffect(() => {
    if (!isSignedInLocal) return;
    try {
      localStorage.setItem(FAVORITES_STORAGE, JSON.stringify(favorites));
    } catch (e) {
      console.error("Favs failour", e);
    }
  }, [favorites, isSignedInLocal]);

  useEffect(() => {
    function onResize() {
      const limit = getFavLimit(window.innerWidth);
      favLimitRef.current = limit;
      setFavorites((prev) =>
        prev.length <= limit ? prev : prev.slice(0, limit)
      );
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchWeatherByCity = useCallback(
    async (city) => {
      if (!city) throw new Error("Missing city");
      const key = city.toLowerCase();
      if (cacheRef.current.has(key)) return cacheRef.current.get(key);

      try {
        const res = await axiosInstance.get("/weather", {
          params: { q: city },
        });
        const d = res.data;
        const mapped = {
          id: `${d.name}-${d.sys?.country || ""}`,
          name: d.name,
          country: d.sys?.country,
          temp: d.main?.temp,
          feels_like: d.main?.feels_like,
          temp_min: d.main?.temp_min,
          temp_max: d.main?.temp_max,
          description: d.weather?.[0]?.description || "",
          icon: d.weather?.[0]?.icon || null,
          raw: d,
          timezone: typeof d.timezone === "number" ? d.timezone : 0,
          fetchedAt: Date.now(),
        };
        cacheRef.current.set(key, mapped);
        return mapped;
      } catch (err) {
        if (err.response) {
          const status = err.response.status;

          throw new Error(err.response.data?.message || `API error ${status}`);
        } else if (err.request) {
          throw new Error(
            "API ERROR"
          );
        } else {
          throw new Error(err.message || "Request error");
        }
      }
    },
    [axiosInstance]
  );
  const fetchHourlyForecast = useCallback(
    async (card) => {
      if (!card) throw new Error("Missing card");
      const lat = card.raw?.coord?.lat;
      const lon = card.raw?.coord?.lon;
      if (lat == null || lon == null)
        throw new Error("hourly forecast is out of reach");

      const cacheKey = `forecast:${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (cacheRef.current.has(cacheKey)) return cacheRef.current.get(cacheKey);

      const res = await axiosInstance.get("/forecast", {
        params: { lat, lon },
      });
      const payload = res.data;
      const tzSeconds =
        typeof payload.city?.timezone === "number"
          ? payload.city.timezone
          : card.timezone ?? 0;

      const labels = payload.list.map((p) => {
        const localMs =
          p.dt * 1000 +
          tzSeconds * 1000 -
          new Date().getTimezoneOffset() * 60000;
        return new Date(localMs).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
      });
      const temps = payload.list.map((p) =>
        typeof p.main?.temp === "number" ? p.main.temp : null
      );
      const result = { labels, temps, raw: payload };
      cacheRef.current.set(cacheKey, result);
      return result;
    },
    [axiosInstance]
  );
  const fetchWeeklyForecast = useCallback(
    async (card) => {
      if (!card) throw new Error("Missing card");
      const lat = card.raw?.coord?.lat;
      const lon = card.raw?.coord?.lon;
      if (lat == null || lon == null)
        throw new Error("weekly forecast is nowhere to be seen");

      const cacheKey = `weekly:${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (cacheRef.current.has(cacheKey)) return cacheRef.current.get(cacheKey);

      const aggregateFromForecast = (payload) => {
        const tzSeconds =
          typeof payload.city?.timezone === "number"
            ? payload.city.timezone
            : 0;
        const groups = new Map();

        payload.list.forEach((p) => {
          const localMs =
            p.dt * 1000 +
            tzSeconds * 1000 -
            new Date().getTimezoneOffset() * 60000;
          const d = new Date(localMs);
          const iso = d.toISOString().slice(0, 10);
          if (!groups.has(iso)) groups.set(iso, []);
          groups.get(iso).push(p);
        });

        const days = Array.from(groups.entries())
          .slice(0, 7)
          .map(([iso, items]) => {
            const temps = items
              .map((it) => it.main?.temp)
              .filter((v) => typeof v === "number");
            const tempMin = temps.length ? Math.min(...temps) : null;
            const tempMax = temps.length ? Math.max(...temps) : null;

            const freq = {};
            items.forEach((it) => {
              const w = it.weather?.[0];
              if (!w) return;
              const key = `${w.icon}||${w.description}`;
              freq[key] = (freq[key] || 0) + 1;
            });
            const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
            const [icon, desc] = best ? best[0].split("||") : [null, ""];

            const dt = items[0].dt;
            const dtMs =
              dt * 1000 +
              (payload.city?.timezone || 0) * 1000 -
              new Date().getTimezoneOffset() * 60000;
            const date = new Date(dtMs);
            const weekday = date.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            return { dt, weekday, icon, desc, tempMin, tempMax, raw: items };
          });

        return { days, raw: payload };
      };

      try {
        const res = await axiosInstance.get("/onecall", {
          params: {
            lat,
            lon,
            exclude: "current,minutely,hourly,alerts",
            units: "metric",
            appid: API_KEY,
          },
        });
        const payload = res.data;
        const tzSeconds =
          typeof payload.timezone_offset === "number"
            ? payload.timezone_offset
            : card.timezone ?? 0;

        const days = (payload.daily || []).slice(0, 7).map((d) => {
          const dtMs =
            (d.dt || 0) * 1000 +
            tzSeconds * 1000 -
            new Date().getTimezoneOffset() * 60000;
          const date = new Date(dtMs);
          const weekday = date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const icon = d.weather?.[0]?.icon || null;
          const desc = d.weather?.[0]?.description || "";
          const tempMin = typeof d.temp?.min === "number" ? d.temp.min : null;
          const tempMax = typeof d.temp?.max === "number" ? d.temp.max : null;
          return { dt: d.dt, weekday, icon, desc, tempMin, tempMax, raw: d };
        });

        const result = { days, raw: payload };
        cacheRef.current.set(cacheKey, result);
        return result;
      } catch (err) {
        console.warn(
          err.response?.status,
          err.response?.data
        );
        try {
          const res2 = await axiosInstance.get("/forecast", {
            params: { lat, lon, appid: API_KEY },
          });
          const aggregated = aggregateFromForecast(res2.data);
          cacheRef.current.set(cacheKey, aggregated);
          return aggregated;
        } catch (err2) {
          console.error("Fallback /forecast failed:", {
            status: err2.response?.status,
            body: err2.response?.data,
            request: err2.config,
          });
          throw err2;
        }
      }
    },
    [axiosInstance]
  );

  const buildChartConfig = (hd) => {
    if (!hd) return null;
    const data = {
      labels: hd.labels,
      datasets: [
        {
          label: "Temperature °C",
          data: hd.temps,
          borderColor: "#ff7a00",
          backgroundColor: "rgba(255,122,0,0.12)",
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y;
              return typeof v === "number" ? `${v.toFixed(1)}°C` : "";
            },
          },
        },
      },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
        y: { ticks: { callback: (val) => `${val}°C` } },
      },
    };

    return { data, options };
  };

  const chartConfig = buildChartConfig(hourlyData);

  useEffect(() => {
    if (!q || q.trim().length < 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setError("");
      setLoading(true);
      try {
        const mapped = await fetchWeatherByCity(q.trim());
        setCards((prev) => {
          const exists = prev.find((c) => c.id === mapped.id);
          const next = exists
            ? [mapped, ...prev.filter((c) => c.id !== mapped.id)]
            : [mapped, ...prev];
          return next;
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [q, fetchWeatherByCity]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!q || q.trim().length < 2) {
      setError("Type at least 2 characters");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    (async () => {
      setError("");
      setLoading(true);
      try {
        const mapped = await fetchWeatherByCity(q.trim());
        setCards((prev) => {
          const exists = prev.find((c) => c.id === mapped.id);
          const next = exists
            ? [mapped, ...prev.filter((c) => c.id !== mapped.id)]
            : [mapped, ...prev];
          return next;
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleRefresh = async (item) => {
    setError("");
    setLoading(true);
    try {
      const updated = await fetchWeatherByCity(item.name);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setFavorites((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );

      if (detailsOpenFor === updated.id) {
        setDetailsCard(updated);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (item) => {
    const normalizedItem = {
      ...item,
      id: item.id || `${item.name}-${item.country}`,
    };

    setFavorites((prev) => {
      const idx = prev.findIndex((f) => f.id === normalizedItem.id);
      const limit = favLimitRef.current || getFavLimit();
      if (idx !== -1) {
        const next = prev.filter((f) => f.id !== normalizedItem.id);
        return next;
      } else {
        let next = [normalizedItem, ...prev];
        if (next.length > limit) next = next.slice(0, limit);
        return next;
      }
    });

    setCards((prev) => {
      const exists = prev.find((c) => c.id === normalizedItem.id);
      if (exists)
        return prev.map((c) =>
          c.id === normalizedItem.id ? { ...c, ...normalizedItem } : c
        );
      return [normalizedItem, ...prev];
    });
  };

  const handleDelete = (item) => {
    setCards((prev) => prev.filter((c) => c.id !== item.id));
    setFavorites((prev) => prev.filter((f) => f.id !== item.id));
    if (detailsOpenFor === item.id) {
      setDetailsOpenFor(null);
      setDetailsCard(null);
    }
  };

  const toggleDetailsStrip = (item) => {
    if (detailsOpenFor === item.id) {
      setDetailsOpenFor(null);
      setDetailsCard(null);
      return;
    }

    setDetailsOpenFor(item.id);
    setDetailsCard(item);

    setCards((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) return prev;
      return [item, ...prev];
    });
  };
  const toggleHourly = async (card) => {
    if (!card) return;

    if (hourlyOpenFor === card.id) {
      setHourlyOpenFor(null);
      setHourlyCard(null);
      setHourlyData(null);
      setHourlyError("");
      return;
    }

    setHourlyOpenFor(card.id);
    setHourlyCard(card);
    setHourlyData(null);
    setHourlyError("");
    setHourlyLoading(true);

    try {
      const data = await fetchHourlyForecast(card);
      setHourlyData(data);
    } catch (e) {
      setHourlyError(e.message || "Hourly Forecast Fail");
      setHourlyData(null);
    } finally {
      setHourlyLoading(false);
    }
  };
  const toggleWeekly = async (card) => {
    if (!card) return;
    if (weeklyOpenFor === card.id) {
      setWeeklyOpenFor(null);
      setWeeklyCard(null);
      setWeeklyData(null);
      setWeeklyError("");
      return;
    }

    setWeeklyOpenFor(card.id);
    setWeeklyCard(card);
    setWeeklyData(null);
    setWeeklyError("");
    setWeeklyLoading(true);

    try {
      const data = await fetchWeeklyForecast(card);
      setWeeklyData(data);
    } catch (e) {
      setWeeklyError(e.message || "Weekly forecast fail");
      setWeeklyData(null);
    } finally {
      setWeeklyLoading(false);
    }
  };

  const visibleCards = useMemo(() => {
    const limit = getFavLimit();
    const favIds = new Set(favorites.map((f) => f.id));
    const favCards = favorites.slice(0, limit);
    if (favCards.length >= limit) return favCards;
    const others = cards.filter((c) => !favIds.has(c.id));
    const fill = others.slice(0, limit - favCards.length);
    return [...favCards, ...fill];
  }, [cards, favorites]);

  const now = new Date();
  const monthYear = now.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
  const weekdayDay = now.toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
  });

  const fmt = {
    temp: (v) => (typeof v === "number" ? `${v.toFixed(1)}°C` : "-"),
    percent: (v) => (typeof v === "number" ? `${v}%` : "-"),
    pressure: (v) => (typeof v === "number" ? `${v} hPa` : "-"),
    wind: (v) => (typeof v === "number" ? `${v} m/s` : "-"),
    visibility: (v) =>
      v === null || v === undefined ? "-" : v >= 10000 ? "Unlimited" : `${v} m`,
  };

  return (
    <Wrap>
      <Inner>
        <Title>Weather dashboard</Title>
        <Sub>
          Create your personal list of favorite cities and always be aware of
          the weather.
        </Sub>

        <MetaDateRow>
          <MetaLeft>{monthYear}</MetaLeft>
          <MetaRight>{weekdayDay}</MetaRight>
        </MetaDateRow>

        <SearchCard role="search">
          <Form onSubmit={handleSubmit}>
            <SearchInputWrapper>
              <SearchIcon>
                <FiSearch />
              </SearchIcon>
              <SearchInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search location..."
                autoComplete="off"
              />
            </SearchInputWrapper>
          </Form>

          <StatusArea>{error && <Err role="alert">{error}</Err>}</StatusArea>
        </SearchCard>

        <CardsStack>
          {visibleCards.length === 0 ? (
            <Empty>Search a city to create a weather card.</Empty>
          ) : (
            visibleCards.map((c) => (
              <WeatherCard
                key={c.id}
                data={c}
                isFavorite={favorites.some((f) => f.id === c.id)}
                onRefresh={() => handleRefresh(c)}
                onToggleFavorite={() => handleToggleFavorite(c)}
                onDelete={() => handleDelete(c)}
                onHourly={() => toggleHourly(c)}
                onWeekly={() => toggleWeekly(c)}
                onSeeMore={() => toggleDetailsStrip(c)}
              />
            ))
          )}
        </CardsStack>

        {detailsOpenFor && detailsCard && (
          <DetailsStrip role="region">
            <DetailsInner>
              <MetricTile>
                <MetricIcon>
                  <FiThermometer size={50} />
                </MetricIcon>
                <MetricBody>
                  <MetricLabel>Feels like</MetricLabel>
                  <MetricValue>
                    {fmt.temp(
                      detailsCard.feels_like ??
                        detailsCard.raw?.main?.feels_like
                    )}
                  </MetricValue>
                </MetricBody>
              </MetricTile>

              <CombinedTile>
                <CombinedIcon>
                  <FiArrowDown size={50} />
                </CombinedIcon>
                <CombinedBody>
                  <CombinedLabel>Min °C</CombinedLabel>
                  <CombinedValue>
                    {fmt.temp(
                      detailsCard.temp_min ?? detailsCard.raw?.main?.temp_min
                    )}
                  </CombinedValue>
                </CombinedBody>

                <Divider />

                <CombinedIcon>
                  <FiArrowUp size={50} />
                </CombinedIcon>
                <CombinedBody>
                  <CombinedLabel>Max °C</CombinedLabel>
                  <CombinedValue>
                    {fmt.temp(
                      detailsCard.temp_max ?? detailsCard.raw?.main?.temp_max
                    )}
                  </CombinedValue>
                </CombinedBody>
              </CombinedTile>

              <MetricTile>
                <MetricIcon>
                  <WiHumidity size={50} />
                </MetricIcon>
                <MetricBody>
                  <MetricLabel>Humidity</MetricLabel>
                  <MetricValue>
                    {fmt.percent(detailsCard.raw?.main?.humidity)}
                  </MetricValue>
                </MetricBody>
              </MetricTile>

              <MetricTile>
                <MetricIcon>
                  <WiBarometer size={50} />
                </MetricIcon>
                <MetricBody>
                  <MetricLabel>Pressure</MetricLabel>
                  <MetricValue>
                    {fmt.pressure(detailsCard.raw?.main?.pressure)}
                  </MetricValue>
                </MetricBody>
              </MetricTile>

              <MetricTile>
                <MetricIcon>
                  <WiStrongWind size={50} />
                </MetricIcon>
                <MetricBody>
                  <MetricLabel>Wind speed</MetricLabel>
                  <MetricValue>
                    {fmt.wind(detailsCard.raw?.wind?.speed)}
                  </MetricValue>
                </MetricBody>
              </MetricTile>

              <MetricTile>
                <MetricIcon>
                  <FiEye size={50} />
                </MetricIcon>
                <MetricBody>
                  <MetricLabel>Visibility</MetricLabel>
                  <MetricValue>
                    {fmt.visibility(detailsCard.raw?.visibility)}
                  </MetricValue>
                </MetricBody>
              </MetricTile>
            </DetailsInner>
          </DetailsStrip>
        )}
        {hourlyOpenFor && hourlyCard && (
          <HourlyStrip role="region">
            <HourlyInner>
              <HourlyHeader>
                <HourlyTitle>
                  Hourly forecast — {hourlyCard.name}
                  {hourlyCard.country ? `, ${hourlyCard.country}` : ""}
                </HourlyTitle>
                <HourlyControls>
                  {hourlyLoading ? <SmallNote>Loading…</SmallNote> : null}
                  {hourlyError ? <ErrorNote>{hourlyError}</ErrorNote> : null}
                  <SmallButton
                    onClick={() => {
                      setHourlyOpenFor(null);
                      setHourlyCard(null);
                      setHourlyData(null);
                      setHourlyError("");
                    }}
                  >
                    Close chart
                  </SmallButton>
                </HourlyControls>
              </HourlyHeader>

              <ChartArea>
                {hourlyLoading && (
                  <ChartPlaceholder>Loading chart…</ChartPlaceholder>
                )}
                {!hourlyLoading && chartConfig && (
                  <div style={{ height: "100%", width: "100%" }}>
                    <Line
                      data={chartConfig.data}
                      options={chartConfig.options}
                    />
                  </div>
                )}
                {!hourlyLoading && !chartConfig && !hourlyError && (
                  <ChartPlaceholder>No hourly data available</ChartPlaceholder>
                )}
              </ChartArea>
            </HourlyInner>
          </HourlyStrip>
        )}
        {weeklyOpenFor && weeklyCard && (
          <WeeklyStrip role="region">
            <WeeklyInner>
              <WeeklyHeader>
                <WeeklyTitle>
                  Weekly forecast — {weeklyCard.name}
                  {weeklyCard.country ? `, ${weeklyCard.country}` : ""}
                </WeeklyTitle>
                <WeeklyControls>
                  {weeklyLoading ? <SmallNote>Loading…</SmallNote> : null}
                  {weeklyError ? <ErrorNote>{weeklyError}</ErrorNote> : null}
                  <SmallButton
                    onClick={() => {
                      setWeeklyOpenFor(null);
                      setWeeklyCard(null);
                      setWeeklyData(null);
                      setWeeklyError("");
                    }}
                  >
                    Close
                  </SmallButton>
                </WeeklyControls>
              </WeeklyHeader>

              <WeeklyList>
                {!weeklyLoading && !weeklyData && !weeklyError && (
                  <PlaceholderNote>No weekly data</PlaceholderNote>
                )}
                {weeklyData &&
                  weeklyData.days.map((d) => (
                    <WeeklyRow key={d.dt}>
                      <DateCol>{d.weekday}</DateCol>
                      <IconCol>
                        {d.icon ? (
                          <img
                            src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`}
                            alt={d.desc}
                            width="44"
                            height="44"
                          />
                        ) : (
                          <IconPlaceholder />
                        )}
                      </IconCol>
                      <TempCol>
                        <TempHigh>
                          {d.tempMax !== null
                            ? `${Math.round(d.tempMax)}°`
                            : "-"}
                        </TempHigh>
                        <TempLow>
                          {d.tempMin !== null
                            ? `${Math.round(d.tempMin)}°`
                            : "-"}
                        </TempLow>
                      </TempCol>
                      <DescCol>{d.desc}</DescCol>
                    </WeeklyRow>
                  ))}
              </WeeklyList>
            </WeeklyInner>
          </WeeklyStrip>
        )}
      </Inner>
    </Wrap>
  );
}

const WeeklyStrip = styled.div`
  margin-top: 18px;
  width: 100%;
  display: flex;
  justify-content: center;
`;
const WeeklyInner = styled.div`
  width: 100%;
  max-width: 980px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 30px rgba(11, 59, 90, 0.06);
  border: 1px solid rgba(7, 17, 38, 0.03);
  box-sizing: border-box;
`;
const WeeklyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;
const WeeklyTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
`;
const WeeklyControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const WeeklyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const WeeklyRow = styled.div`
  display: grid;
  grid-template-columns: 140px 56px 96px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: linear-gradient(180deg, #fff, #fbfbff);
  border: 1px solid rgba(7, 17, 38, 0.03);
`;
const DateCol = styled.div`
  font-weight: 700;
  color: #07253a;
`;
const IconCol = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
const IconPlaceholder = styled.div`
  width: 44px;
  height: 44px;
  background: rgba(7, 37, 58, 0.06);
  border-radius: 6px;
`;
const TempCol = styled.div`
  width: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
`;
const TempHigh = styled.div`
  font-weight: 800;
  color: #ff7a00;
`;
const TempLow = styled.div`
  font-size: 13px;
  color: rgba(7, 37, 58, 0.6);
`;
const DescCol = styled.div`
  color: rgba(7, 37, 58, 0.75);
  @media (max-width: 760px) {
    display: none;
  }
`;
const PlaceholderNote = styled.div`
  color: rgba(7, 37, 58, 0.6);
  padding: 12px;
`;

const HourlyStrip = styled.div`
  margin-top: 18px;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const HourlyInner = styled.div`
  width: 100%;
  max-width: 980px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 30px rgba(11, 59, 90, 0.06);
  border: 1px solid rgba(7, 17, 38, 0.03);
  box-sizing: border-box;
`;

const HourlyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const HourlyTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
`;

const HourlyControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SmallButton = styled.button`
  background: transparent;
  border: 1px solid rgba(7, 17, 38, 0.06);
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
`;

const SmallNote = styled.div`
  color: rgba(7, 37, 58, 0.6);
  font-size: 13px;
`;

const ErrorNote = styled.div`
  color: #9b1c1c;
  font-size: 13px;
`;

const ChartArea = styled.div`
  width: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChartPlaceholder = styled.div`
  color: rgba(7, 37, 58, 0.6);
  padding: 24px;
`;

const Wrap = styled.section`
  position: relative;
  width: 100%;
  padding: 36px 18px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  color: #071126;
`;

const Inner = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 980px;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 36px;
  font-weight: 800;
  text-align: center;
`;

const Sub = styled.p`
  margin: 0 0 12px 0;
  text-align: center;
  color: rgba(7, 17, 38, 0.78);
  font-size: 16px;
`;

const MetaDateRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-bottom: 18px;
  color: rgba(7, 17, 38, 0.65);
  font-size: 13px;
`;
const MetaLeft = styled.div``;
const MetaRight = styled.div``;

const SearchCard = styled.div`
  margin: 0 auto;
  width: 90%;
  max-width: 760px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 8px 30px rgba(11, 59, 90, 0.06);
  border: 1px solid rgba(7, 17, 38, 0.03);
`;

const Form = styled.form`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const SearchInputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background: #fbfbfb;
  border-radius: 10px;
  padding: 8px 12px;
  border: 1px solid #e6eef6;
`;

const SearchIcon = styled.span`
  margin-right: 8px;
  font-size: 18px;
  color: #9fb0c6;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  font-size: 16px;
  background: transparent;
  color: #073047;
`;

const StatusArea = styled.div`
  margin-top: 8px;
`;

const Err = styled.div`
  color: #9b1c1c;
  background: #ffecec;
  padding: 8px 10px;
  border-radius: 8px;
  display: inline-block;
`;

const CardsStack = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
  justify-content: center;
  align-items: flex-start;
  flex-direction: row;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;

  @media (max-width: 760px) {
    overflow-x: auto;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
  }

  & > * {
    max-width: 320px;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    & > * {
      flex: 0 0 360px;
      max-width: 360px;
    }
  }

  @media (min-width: 1024px) {
    & > * {
      flex: 0 0 300px;
      max-width: 300px;
    }
  }
`;

const Empty = styled.div`
  color: rgba(7, 17, 38, 0.55);
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid rgba(7, 17, 38, 0.03);
`;

const DetailsStrip = styled.div`
  margin-top: 18px;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`;

const DetailsInner = styled.div`
  width: 100%;
  max-width: 980px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  align-items: stretch;
  padding: 12px;
  box-sizing: border-box;

  @media (max-width: 760px) {
    width: 50%;
    padding: 0;

    padding-bottom: 8px;
  }
`;

const MetricTile = styled.div`
  min-width: 140px;
  flex: 0 0 140px;
  background: linear-gradient(180deg, #fff, #fbfbff);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 20px rgba(7, 17, 38, 0.06);
  border: 1px solid rgba(7, 17, 38, 0.04);
  display: flex;
  gap: 10px;
  align-items: center;
  box-sizing: border-box;

  @media (min-width: 1024px) {
    min-width: 160px;
    flex: 0 0 160px;
  }
`;

const MetricIcon = styled.div`
  width: 35px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #ff7a00;
  flex-shrink: 0;
`;

const MetricBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
`;

const MetricLabel = styled.div`
  font-size: 12px;
  color: rgba(7, 37, 58, 0.65);
  line-height: 1;
`;

const MetricValue = styled.div`
  font-weight: 800;
  font-size: 16px;
  color: #07253a;
  line-height: 1;
`;

const CombinedTile = styled.div`
  min-width: 140px;
  flex: 0 0 140px;
  background: linear-gradient(180deg, #fff, #fbfbff);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 20px rgba(7, 17, 38, 0.06);
  border: 1px solid rgba(7, 17, 38, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  box-sizing: border-box;

  @media (min-width: 1024px) {
    min-width: 160px;
    flex: 0 0 160px;
  }
`;

const CombinedIcon = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #ff7a00;
  flex-shrink: 0;
`;

const CombinedBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const CombinedLabel = styled.div`
  font-size: 12px;
  color: rgba(7, 37, 58, 0.65);
  font-weight: 600;
  line-height: 1;
`;

const CombinedValue = styled.div`
  font-weight: 800;
  font-size: 16px;
  color: #07253a;
  line-height: 1;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(7, 17, 38, 0.03);
  margin: 4px 0;
`;
