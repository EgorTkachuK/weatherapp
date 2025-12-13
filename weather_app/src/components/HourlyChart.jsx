import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import axios from "axios";
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

export default function HourlyChart({
  lat,
  lon,
  name,
  country,
  apiKey,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chartData, setChartData] = useState(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (lat == null || lon == null) return;
    const cacheKey = `forecast:${lat.toFixed(4)},${lon.toFixed(4)}`;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setChartData(null);
      try {
        if (cacheRef.current.has(cacheKey)) {
          if (!cancelled) setChartData(cacheRef.current.get(cacheKey));
          return;
        }
        const res = await axios.get(
          "https://api.openweathermap.org/data/2.5/forecast",
          {
            params: { lat, lon, appid: apiKey, units: "metric" },
          }
        );
        const payload = res.data;
        const tz =
          typeof payload.city?.timezone === "number"
            ? payload.city.timezone
            : 0;
        const labels = payload.list.map((p) => {
          const localMs =
            p.dt * 1000 + tz * 1000 - new Date().getTimezoneOffset() * 60000;
          return new Date(localMs).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
        });
        const temps = payload.list.map((p) =>
          p.main && typeof p.main.temp === "number" ? p.main.temp : null
        );
        const result = { labels, temps, raw: payload };
        cacheRef.current.set(cacheKey, result);
        if (!cancelled) setChartData(result);
      } catch (e) {
        if (!cancelled) setError(e.message || "Fail of the hour forecast");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lat, lon, apiKey]);

  const buildConfig = (hd) => {
    if (!hd) return null;
    return {
      data: {
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
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
          y: { ticks: { callback: (v) => `${v}°C` } },
        },
      },
    };
  };

  const cfg = buildConfig(chartData);

  return (
    <Strip role="region">
      <Inner>
        <Header>
          <Title>
            Hourly forecast — {name}
            {country ? `, ${country}` : ""}
          </Title>
          <Controls>
            {loading && <Note>Loading…</Note>}
            {error && <ErrorNote>{error}</ErrorNote>}
            <CloseBtn onClick={onClose}>Close chart</CloseBtn>
          </Controls>
        </Header>

        <ChartWrap>
          {loading && <Placeholder>Loading chart…</Placeholder>}
          {!loading && cfg && (
            <div style={{ height: 260 }}>
              <Line data={cfg.data} options={cfg.options} />
            </div>
          )}
          {!loading && !cfg && !error && (
            <Placeholder>No hourly data available</Placeholder>
          )}
        </ChartWrap>
      </Inner>
    </Strip>
  );
}

const Strip = styled.div`
  margin-top: 18px;
  width: 100%;
  display: flex;
  justify-content: center;
`;
const Inner = styled.div`
  width: 100%;
  max-width: 980px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 30px rgba(11, 59, 90, 0.06);
  border: 1px solid rgba(7, 17, 38, 0.03);
  box-sizing: border-box;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;
const Title = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
`;
const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;
const CloseBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(7, 17, 38, 0.06);
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
`;
const Note = styled.div`
  color: rgba(7, 37, 58, 0.6);
  font-size: 13px;
`;
const ErrorNote = styled.div`
  color: #9b1c1c;
  font-size: 13px;
`;
const ChartWrap = styled.div`
  width: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Placeholder = styled.div`
  color: rgba(7, 37, 58, 0.6);
  padding: 24px;
`;
