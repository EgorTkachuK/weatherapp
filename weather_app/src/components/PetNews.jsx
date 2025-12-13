import React, { useEffect, useState, useRef, useCallback } from "react";
import styled from "styled-components";
import axios from "axios";

const NEWS_API_KEY = "ecf4d61875d34e628ebb3b1779711d8d";
const PIXABAY_API_KEY = "52493410-eb762003eccb1a9fab509868c";

const NEWS_PAGE_SIZE = 20;

const newsAxios = axios.create({
  baseURL: "https://newsapi.org/v2",
  timeout: 10000,
  params: { apiKey: NEWS_API_KEY },
});

const pixabayAxios = axios.create({
  baseURL: "https://pixabay.com/api/",
  timeout: 10000,
  params: { key: PIXABAY_API_KEY },
});

const PET_KEYWORDS = [
  "pet",
  "pets",
  "dog",
  "dogs",
  "cat",
  "cats",
  "puppy",
  "kitten",
  "vet",
  "veterinary",
];

function titleHasPetKeyword(article) {
  const title = (article.title || "").toLowerCase();
  return PET_KEYWORDS.some((k) => title.includes(k));
}
function textHasPetKeyword(article) {
  const text = `${article.title || ""} ${article.description || ""} ${
    article.content || ""
  }`.toLowerCase();
  return PET_KEYWORDS.some((k) => text.includes(k));
}
function pickPixabayQuery(article) {
  const text = `${article.title || ""} ${article.description || ""} ${
    article.content || ""
  }`.toLowerCase();
  if (text.includes("dog") || text.includes("puppy")) return "dog";
  if (text.includes("cat") || text.includes("kitten")) return "cat";
  return "pets";
}
function dedupeByUrl(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    if (!it || !it.url) continue;
    if (seen.has(it.url)) continue;
    seen.add(it.url);
    out.push(it);
  }
  return out;
}
async function fetchRandomPixabayImage(query) {
  try {
    const res = await pixabayAxios.get("/", {
      params: { q: query, image_type: "photo", safesearch: true, per_page: 20 },
    });
    const hits = res.data?.hits || [];
    if (!hits.length) return null;
    const pick = hits[Math.floor(Math.random() * hits.length)];
    return pick.webformatURL || pick.largeImageURL || null;
  } catch {
    return null;
  }
}

export default function PetNews() {
  const [isWide, setIsWide] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState([]);
  const cacheRef = useRef({
    pages: new Map(),

    pool: [],

    poolIndex: 0,
  });

  useEffect(() => {
    function onResize() {
      setIsWide(window.innerWidth >= 768);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const queries = [
    "dogs OR dog OR puppy",
    "cats OR cat OR kitten",
    "pets OR animals OR 'pet'",
  ];

  const fetchNewsPage = useCallback(async (q, page = 1) => {
    const key = `${q}::${page}`;
    if (cacheRef.current.pages.has(key)) return cacheRef.current.pages.get(key);

    const res = await newsAxios.get("/everything", {
      params: {
        q,
        language: "en",
        sortBy: "publishedAt",
        pageSize: NEWS_PAGE_SIZE,
        page,
      },
    });
    const items = (res.data?.articles || []).map((a) => ({
      title: a.title || "",
      url: a.url,
      source: a.source?.name || "",
      publishedAt: a.publishedAt,
      description: a.description || "",
      content: a.content || "",
      image: a.urlToImage || null,
    }));
    cacheRef.current.pages.set(key, items);
    return items;
  }, []);

  const ensurePool = useCallback(
    async (n = 8) => {
      if (cacheRef.current.pool.length - cacheRef.current.poolIndex >= n)
        return;

      let page = 1;
      let attempts = 0;
      while (
        cacheRef.current.pool.length - cacheRef.current.poolIndex < n &&
        attempts < 8
      ) {
        const fetchPromises = queries.map((q) =>
          fetchNewsPage(q, page).catch(() => [])
        );
        const results = await Promise.all(fetchPromises);
        const flat = results.flat();

        const titleMatches = flat.filter((it) => titleHasPetKeyword(it));
        const fallbackMatches = flat.filter(
          (it) => !titleHasPetKeyword(it) && textHasPetKeyword(it)
        );
        const combined = dedupeByUrl([
          ...cacheRef.current.pool,
          ...titleMatches,
          ...fallbackMatches,
        ]);
        cacheRef.current.pool = combined;
        page += 1;
        attempts += 1;
      }
    },
    [fetchNewsPage]
  );

  const buildBatch = useCallback(
    async (forceFetch = false) => {
      setLoading(true);
      setError("");
      try {
        await ensurePool(4);

        if (cacheRef.current.pool.length - cacheRef.current.poolIndex < 4) {
          try {
            const res = await newsAxios.get("/everything", {
              params: {
                q: "pets OR animals",
                language: "en",
                sortBy: "publishedAt",
                pageSize: 40,
              },
            });
            const extra = (res.data?.articles || []).map((a) => ({
              title: a.title || "",
              url: a.url,
              source: a.source?.name || "",
              publishedAt: a.publishedAt,
              description: a.description || "",
              content: a.content || "",
              image: a.urlToImage || null,
            }));
            cacheRef.current.pool = dedupeByUrl([
              ...cacheRef.current.pool,
              ...extra.filter((it) => textHasPetKeyword(it)),
            ]);
          } catch {}
        }

        let start = cacheRef.current.poolIndex;
        if (start >= cacheRef.current.pool.length) start = 0;
        const batch = [];
        let idx = start;
        while (batch.length < 4 && cacheRef.current.pool.length > 0) {
          if (idx >= cacheRef.current.pool.length) idx = 0;
          const candidate = cacheRef.current.pool[idx];

          const q = pickPixabayQuery(candidate);
          const pix = await fetchRandomPixabayImage(q);
          batch.push({ ...candidate, image: pix || candidate.image || null });
          idx += 1;
        }

        cacheRef.current.poolIndex =
          idx % Math.max(1, cacheRef.current.pool.length);

        while (batch.length < 4) {
          batch.push({
            title: "More pet stories coming soon",
            url: "https://newsapi.org/",
            source: "News",
            publishedAt: new Date().toISOString(),
            description: "",
            content: "",
            image: null,
          });
        }

        setVisible(batch);
      } catch (err) {
        console.error(
          "PetNews failed:",
          err?.response?.data || err?.message || err
        );
        setError("Failed to load pet news");
      } finally {
        setLoading(false);
      }
    },
    [ensurePool]
  );

  useEffect(() => {
    if (!isWide) return;
    buildBatch();
  }, [isWide, buildBatch]);

  if (!isWide) return null;

  function handleSeeMore() {
    buildBatch(true);
  }

  return (
    <Section role="region">
      <Container>
        <Header>
          <Title>Interacting with our pets</Title>
        </Header>

        {error ? (
          <Error>News unavailable: {error}</Error>
        ) : (
          <>
            <Row>
              {visible.map((a, i) => (
                <Item
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ImgWrap>
                    {a.image ? (
                      <img src={a.image} alt={a.title} />
                    ) : (
                      <NoImage>🐾</NoImage>
                    )}
                  </ImgWrap>
                  <Info>
                    <Headline>{a.title}</Headline>
                    <Meta>
                      <Source>{a.source}</Source>
                      <Dot>•</Dot>
                      <Time>{formatDate(a.publishedAt)}</Time>
                    </Meta>
                  </Info>
                </Item>
              ))}
            </Row>

            <SeeMoreRow>
              <SeeMoreBtn onClick={handleSeeMore} disabled={loading}>
                {loading ? "Loading…" : "See more"}
              </SeeMoreBtn>
            </SeeMoreRow>
          </>
        )}
      </Container>
    </Section>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const Section = styled.div`
  width: 100vw;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 18px;
  box-sizing: border-box;
  background: transparent;
`;

const Container = styled.div`
  max-width: 100%;
  padding: 18px 24px;
  background: linear-gradient(180deg, #ffffff, #fbfbff);
  border-top: 1px solid rgba(7, 17, 38, 0.03);
  border-bottom: 1px solid rgba(7, 17, 38, 0.03);
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;
const Title = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  color: #07253a;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  align-items: stretch;
  @media (max-width: 1200px) {
    gap: 10px;
  }
`;

const Item = styled.a`
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, #fff, #fbfbff);
  border: 1px solid rgba(7, 17, 38, 0.03);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 30px rgba(11, 59, 90, 0.08);
  }
`;

const ImgWrap = styled.div`
  width: 100%;
  height: 160px;
  background: rgba(7, 37, 58, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const NoImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  background: linear-gradient(
    135deg,
    rgba(255, 122, 0, 0.06),
    rgba(7, 37, 58, 0.04)
  );
`;

const Info = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const Headline = styled.div`
  font-weight: 800;
  font-size: 14px;
  color: #07253a;
  line-height: 1.2;
  max-height: 3.6em;
  overflow: hidden;
`;
const Meta = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  color: rgba(7, 37, 58, 0.6);
  font-size: 12px;
`;
const Source = styled.div`
  font-weight: 700;
`;
const Dot = styled.div``;
const Time = styled.div``;

const SeeMoreRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 14px;
`;
const SeeMoreBtn = styled.button`
  padding: 10px 16px;
  border-radius: 10px;
  background: #07253a;
  color: #fff;
  border: none;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 0.12s ease, transform 0.12s ease;
  &:hover {
    transform: translateY(-2px);
  }
  &:disabled,
  &[aria-disabled="true"] {
    opacity: 0.45;
    cursor: default;
    transform: none;
  }
`;

const Error = styled.div`
  padding: 12px;
  color: #9b1c1c;
`;
