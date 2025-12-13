import React from "react";
import styled from "styled-components";
import { FiRefreshCw, FiHeart, FiTrash2 } from "react-icons/fi";

export default function WeatherCard({
  data,
  onRefresh,
  onToggleFavorite,
  onDelete,
  onSeeMore,
  onHourly,
  onWeekly,
  isFavorite = false,
}) {
  if (!data) return null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = now.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "long",
  });

  return (
    <Card role="article" aria-label={`Weather for ${data.name}`}>
      <Header>
        <Location>
          <City>{data.name}</City>
          <Country>{data.country}</Country>
        </Location>

        <Meta>
          <Time>{timeStr}</Time>
          <DateText>{dateStr}</DateText>
        </Meta>
      </Header>

      <Body>
        <Left>
          <Temp>{Math.round(data.temp)}°C</Temp>
          <Desc>{data.description}</Desc>
        </Left>

        <Right>
          {data.icon ? (
            <IconImg
              src={`https://openweathermap.org/img/wn/${data.icon}@4x.png`}
              alt={data.description || "weather icon"}
              width="96"
              height="96"
            />
          ) : (
            <IconPlaceholder aria-hidden>☀️</IconPlaceholder>
          )}
        </Right>
      </Body>

      <PrimaryActions>
        <PrimaryBtn
          type="button"
          onClick={() => onHourly && onHourly(data)}
          aria-label="Hourly forecast"
        >
          Hourly forecast
        </PrimaryBtn>

        <PrimaryBtn
          type="button"
          onClick={() => onWeekly && onWeekly(data)}
          aria-label="Weekly forecast"
        >
          Weekly forecast
        </PrimaryBtn>

        <SeeMoreBtn
          type="button"
          onClick={() => onSeeMore && onSeeMore(data)}
          aria-label="See more"
        >
          See more
        </SeeMoreBtn>
      </PrimaryActions>

      <Footer>
        <SmallAction
          type="button"
          onClick={() => onRefresh && onRefresh(data)}
          title="Refresh"
          aria-label="Refresh"
        >
          <FiRefreshCw />
        </SmallAction>

        <SmallAction
          type="button"
          onClick={() => onToggleFavorite && onToggleFavorite(data)}
          title={isFavorite ? "Unfavorite" : "Add to favorites"}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Unfavorite" : "Add to favorites"}
        >
          <FiHeart style={{ color: isFavorite ? "red" : "inherit" }} />
        </SmallAction>

        <SmallActionAlt
          type="button"
          onClick={() => onDelete && onDelete(data)}
          title="Delete"
          aria-label="Delete"
        >
          <FiTrash2 />
        </SmallActionAlt>
      </Footer>
    </Card>
  );
}

const Card = styled.section`
  width: 100%;
  max-width: 760px;

  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 28px rgba(7, 17, 38, 0.08);
  border: 1px solid rgba(7, 17, 38, 0.04);
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: #07253a;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Location = styled.div``;
const City = styled.div`
  font-weight: 800;
  font-size: 18px;
`;
const Country = styled.div`
  font-size: 12px;
  color: rgba(7, 37, 58, 0.6);
`;

const Meta = styled.div`
  text-align: right;
  font-size: 12px;
  color: rgba(7, 37, 58, 0.6);
`;
const Time = styled.div`
  font-weight: 700;
`;
const DateText = styled.div`
  font-size: 11px;
  margin-top: 4px;
`;

const Body = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
`;
const Temp = styled.div`
  font-size: 42px;
  font-weight: 900;
  line-height: 1;
`;
const Desc = styled.div`
  margin-top: 6px;
  color: rgba(7, 37, 58, 0.7);
  text-transform: capitalize;
`;

const Right = styled.div`
  width: 110px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconImg = styled.img`
  display: block;
  width: 96px;
  height: 96px;
  object-fit: contain;
`;

const IconPlaceholder = styled.div`
  font-size: 42px;
  opacity: 0.9;
`;

const PrimaryActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled.button`
  flex: 1 1 auto;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: #ffb36c;
  color: white;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  min-width: 120px;

  &:hover {
    filter: brightness(0.98);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
`;

const SeeMoreBtn = styled(PrimaryBtn)`
  background: transparent;
  color: #ffb36c;
  border: 1px solid rgba(255, 122, 0, 0.12);
`;

const Footer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
`;

const SmallAction = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(7, 17, 38, 0.06);
  background: #fff;
  color: #000;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(7, 17, 38, 0.06);
  }
  &:active {
    transform: translateY(0);
  }
`;

const SmallActionAlt = styled(SmallAction)`
  background: transparent;
  border: 1px solid rgba(7, 17, 38, 0.06);
`;
