import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import highland from "../img/nature/highland_forest.jpg";
import lake from "../img/nature/mountain_lake.jpg";
import sunrise from "../img/nature/sunrise_forest.jpg";
import wave from "../img/nature/wave.jpg";
import lonely from "../img/nature/lonely_mountain.jpg";

const IMAGES = [highland, lake, sunrise, wave, lonely];

export default function SimpleButtonScroller({ images = IMAGES }) {
  const imgs = (images || IMAGES).slice(0, 5);
  const scrollerRef = useRef(null);
  const autoScrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(2);

  useEffect(() => {
    centerIndex(currentIndex);
  }, []);

  useEffect(() => {
    updateActive(currentIndex);
  }, [currentIndex]);

  function centerIndex(index) {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = el.querySelectorAll("[data-card]");
    if (!cards || !cards[index]) return;
    const target = cards[index];
    const offset =
      target.offsetLeft - (el.clientWidth - target.clientWidth) / 2;
    el.scrollLeft = offset;
    setCurrentIndex(index);
    updateActive(index);
  }

  function updateActive(index) {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll("[data-card]"));
    if (!cards.length) return;
    const idx = typeof index === "number" ? index : currentIndex;
    cards.forEach((c, i) => {
      c.dataset.active = i === idx ? "true" : "false";
    });
  }

  function clampIndex(i) {
    return Math.max(0, Math.min(imgs.length - 1, i));
  }

  function stepIndex(direction = "right") {
    const next = direction === "right" ? currentIndex + 1 : currentIndex - 1;
    const clamped = clampIndex(next);
    if (clamped === currentIndex) return;
    centerIndex(clamped);
  }

  function startAutoScroll(direction = "right") {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    stepIndex(direction);
    autoScrollRef.current = setInterval(() => {
      const next = direction === "right" ? currentIndex + 1 : currentIndex - 1;
      const clamped = clampIndex(next);
      if (clamped === currentIndex) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
        return;
      }
      centerIndex(clamped);
    }, 220);
  }

  function stopAutoScroll() {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, []);

  return (
    <Section>
      <Header>
        <Title>Beautiful nature</Title>
      </Header>

      <ScrollerWrap>
        <NavButtonLeft
          onClick={() => stepIndex("left")}
          onMouseDown={() => startAutoScroll("left")}
          onMouseUp={stopAutoScroll}
          onMouseLeave={stopAutoScroll}
          onTouchStart={() => startAutoScroll("left")}
          onTouchEnd={stopAutoScroll}
        >
          ‹
        </NavButtonLeft>

        <Scroller ref={scrollerRef} tabIndex={0}>
          {imgs.map((src, i) => (
            <Card
              key={i}
              data-card
              role="group"
              data-active={i === currentIndex ? "true" : "false"}
            >
              <Img src={src} alt={`Slide ${i + 1}`} draggable={false} />
            </Card>
          ))}
        </Scroller>

        <NavButtonRight
          onClick={() => stepIndex("right")}
          onMouseDown={() => startAutoScroll("right")}
          onMouseUp={stopAutoScroll}
          onMouseLeave={stopAutoScroll}
          onTouchStart={() => startAutoScroll("right")}
          onTouchEnd={stopAutoScroll}
        >
          ›
        </NavButtonRight>
      </ScrollerWrap>
    </Section>
  );
}

const Section = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: 18px 0;

  @media (max-width: 1200px) {
    display: none;
  }
`;

const Header = styled.div`
  max-width: 1200px;
  margin: 0 auto 12px;
  padding: 0 18px;
`;
const Title = styled.h3`
  margin: 0;
  font-size: 20px;
  color: #07253a;
`;

const ScrollerWrap = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const NavButtonBase = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: none;
  background: #07253a;
  color: #fff;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.12s ease, transform 0.12s ease;
  &:hover {
    transform: translateY(-2px);
  }
  &:disabled {
    opacity: 0.35;
    cursor: default;
    transform: none;
  }
`;

const NavButtonLeft = styled(NavButtonBase)``;
const NavButtonRight = styled(NavButtonBase)``;

const Scroller = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: auto;
  -webkit-overflow-scrolling: touch;
  padding: 6px 0;
  outline: none;
  scroll-snap-type: x mandatory;
  flex: 1;

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(7, 37, 58, 0.12);
    border-radius: 8px;
  }
`;

const Card = styled.div`
  flex: 0 0 40%;
  min-width: 180px;
  max-width: 34vw;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg, #fff, #fbfbff);
  border: 1px solid rgba(7, 17, 38, 0.06);
  box-shadow: 0 8px 20px rgba(11, 59, 90, 0.04);
  scroll-snap-align: center;
  transform-origin: center;
  transition: transform 0ms, opacity 0ms;
  &[data-active="true"] {
    transform: scale(1.08);
    z-index: 3;
    opacity: 1;
    flex: 0 0 50%;
    max-width: 46vw;
  }
  &[data-active="false"] {
    transform: scale(0.86);
    z-index: 1;
    opacity: 0.95;
  }

  @media (max-width: 980px) {
    flex: 0 0 50%;
    max-width: 48vw;
    &[data-active="true"] {
      flex: 0 0 60%;
      max-width: 64vw;
    }
  }
  @media (max-width: 768px) {
    display: none;
  }
`;

const Img = styled.img`
  width: 100%;
  height: 320px;
  object-fit: cover;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
`;
