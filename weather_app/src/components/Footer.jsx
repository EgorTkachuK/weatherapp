import styled from "styled-components";

import { FaInstagram, FaFacebookF, FaWhatsapp } from "react-icons/fa";
import logo from "../img/logos/logo.png";
export default function Footer({id}) {
  return (
    <FooterWrap id={id}>
      <FooterInner>
        <Left>
          <IconWrap>
            <Logo src={logo} alt="logo" />
          </IconWrap>
        </Left>

        <Center>
          <BlockTitle>Address</BlockTitle>
          <Address>
            <div>Svobody str. 35</div>
            <div>Kyiv</div>
            <div>Ukraine</div>
          </Address>
        </Center>

        <Right>
          <BlockTitle>Contact us</BlockTitle>
          <ContactRow>
            <SocialLink
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </SocialLink>

            <SocialLink
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebookF />
            </SocialLink>

            <SocialLink
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp />
            </SocialLink>
          </ContactRow>
        </Right>
      </FooterInner>

      <Divider />
    </FooterWrap>
  );
}

const Logo = styled.img`
  width: 34px;
  height: 22px;
  @media (min-width: 768px) {
    width: 54px;
    height: 36px;
  }
  @media (min-width: 1200px) {
    width: 82px;
    height: 56px;
  }
`;

const FooterWrap = styled.footer`
  background: #ffffff;
  color: #07253a;
  border-top: 1px solid rgba(7, 17, 38, 0.06);
  padding: 28px 18px;
  box-sizing: border-box;
`;

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const Left = styled.div`
  flex: 1 1 260px;
  min-width: 220px;
`;

const IconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 8px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: 22px;
`;


const Center = styled.div`
  flex: 1 1 220px;
  min-width: 180px;
`;

const BlockTitle = styled.div`
  font-weight: 800;
  margin-bottom: 8px;
  color: #07253a;
`;

const Address = styled.address`
  font-style: normal;
  color: rgba(7, 37, 58, 0.75);
  line-height: 1.6;
  font-size: 14px;
`;

const Right = styled.div`
  flex: 1 1 220px;
  min-width: 180px;
`;

const ContactRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
`;

const SocialLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid rgba(7, 17, 38, 0.06);
  color: #ff7a00;
  font-size: 20px;
  text-decoration: none;
  transition: transform 120ms ease, box-shadow 120ms ease;
  box-shadow: 0 6px 18px rgba(7, 37, 58, 0.02);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(7, 37, 58, 0.06);
  }
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(7, 17, 38, 0.04);
`;



