import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import logo from "../img/logos/logo.png";
import userIcon from "../img/logos/user.png";
import close from "../img/logos/close_header.png";
import open from "../img/logos/open_header.png";

const STORAGE_KEY = "app_user";

export function Header() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [modalMode, setModalMode] = useState(null); 
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const closeModal = () => setModalMode(null);
  const openSignup = () => setModalMode("signup");
  const openProfile = () => setModalMode("profile");

  const handleLogout = () => {
    setUser(null);
    closeModal();
    setMenuOpen(false);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    const name = (e.target.elements.username && e.target.elements.username.value) || "";
    if (!name.trim()) return;
    setUser({ name: name.trim() });
    closeModal();
  };

 
  const toggleMenu = () => setMenuOpen((s) => !s);


  return (
    <>
      <TopBar >
        <Left>
          <Logo src={logo} alt="logo" />
        </Left>

        <Center>
          <Nav>
            <NavLink href="#">Who we are</NavLink>
            <NavLink href="#">Contacts</NavLink>
            <NavLink href="#">Menu</NavLink>
          </Nav>
        </Center>

        <Right>
          <MenuTrigger
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={toggleMenu}
            data-testid="menu-trigger"
          >
            <span>Menu</span>
            <Arrow src={menuOpen ? close : open} alt="menu toggle" />
          </MenuTrigger>

          
          {user ? (
            <UserBadge className="desktop-control">{user.name}</UserBadge>
          ) : (
            <SignUpButton className="desktop-control" onClick={openSignup}>Sign Up</SignUpButton>
          )}

          <IconButton
            className="desktop-control"
            onClick={() => {
              if (!user) return;
              openProfile();
            }}
            aria-label="User"
            aria-disabled={!user}
            disabled={!user}
          >
            <img src={userIcon} alt="user_icon" />
          </IconButton>
        </Right>
      </TopBar>

      <PanelWrapper aria-hidden={!menuOpen} style={{ height: menuOpen ? undefined : 0 }}>
        <SlidePanel ref={panelRef} open={menuOpen} onClick={(e) => e.stopPropagation()}>
          <PanelInner>
            <PanelLinks>
              <PanelLink href="#">Who we are</PanelLink>
              <PanelLink href="#">Contacts</PanelLink>
              <PanelLink href="#">Menu</PanelLink>
            </PanelLinks>

            <PanelRight>
          
              {user ? (
                <PanelUser>
                  <AvatarButton
                    onClick={() => {
                      openProfile();
                      setMenuOpen(false);
                    }}
                    aria-label="Open profile"
                  >
                    <UserImg src={userIcon} alt="user" />
                  </AvatarButton>
                  <div>
                    <PanelUserName>{user.name}</PanelUserName>
                  </div>
                </PanelUser>
              ) : (
                <Primary
                  onClick={() => {
                    openSignup();
                    setMenuOpen(false);
                  }}
                >
                  Sign Up
                </Primary>
              )}
            </PanelRight>
          </PanelInner>
        </SlidePanel>
      </PanelWrapper>


      {modalMode && (
        <Overlay onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <Dialog>
            {modalMode === "profile" ? (
              <>
                <DialogTitle>Profile</DialogTitle>
                <ProfileBody>
                  <ProfileName>{user?.name}</ProfileName>
                  <ProfileActions>
                    <Primary onClick={handleLogout}>Log out</Primary>
                  </ProfileActions>
                </ProfileBody>
              </>
            ) : (
              <SignUpForm onSubmit={handleSignupSubmit}>
                <DialogTitle>Sign up</DialogTitle>

                <Label>
                  Username
                  <Input name="username" placeholder="Username" />
                </Label>

                <Label>
                  E-Mail
                  <Input name="email" type="email" placeholder="E-Mail" />
                </Label>

                <Label>
                  Password
                  <Input name="password" type="password" placeholder="Password" />
                </Label>

                <FormActions>
                  <Primary type="submit">Sign up</Primary>
                </FormActions>
              </SignUpForm>
            )}
          </Dialog>
        </Overlay>
      )}
    </>
  );
}

const TopBar = styled.header`
display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 14px 50px;
  background: #fff;
  border-bottom: 1px solid #eee;
  @media (min-width: 768px) {padding: 17px 100px;}
  @media (min-width: 1200px) {padding: 12px 150px;}
`;

const Left = styled.div`display:flex; align-items:center;`;
const Center = styled.div`display:flex; justify-content:center;`;
const Right = styled.div`display:flex; align-items:center; gap:10px;`;

const Logo = styled.img`
  width: 34px;
height:22px;
  @media (min-width: 768px) {width: 54px; height:36px;}
@media (min-width: 1200px) {width: 82px; height:56px;}`;


const Nav = styled.nav`
  display: none;
  gap: 45px;
  @media (min-width: 768px) {
    display: flex;
    margin-right: 10vw;
  }
    @media (min-width: 1200px) {
    gap: 49px;
    margin-right: 30vw;
`;
const NavLink = styled.a`
font-family: Montserrat Alternates;
font-weight: 500;

font-size: 10px;
color:#000000; 
text-decoration:none;
  @media (min-width: 1200px) {
    font-size: 12px;
  }
 `;


const MenuTrigger = styled.button`
  background: transparent;
  border: none;

font-family: Montserrat Alternates;
font-weight: 500;

font-size: 10px;
  cursor: pointer;
 
 
  align-items: center;
  gap: 5px;

  @media (min-width: 768px) {
    display: none;
  }
`;

const Arrow = styled.img`
  margin-left: 5px;
  font-weight: 800;
`;


const DesktopControlStyles = `
  display: none;

  @media (min-width: 768px) {
    display: inline-flex;
    align-items: center;
  }
`;

const SignUpButton = styled.button`
  background: #FFB36C;
 display: flex;
 justify-content: center;
  border: none;
width: 107px;
height: 35px;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;

font-family: Montserrat Alternates;
font-weight: 500;

font-size: 10px;



  ${DesktopControlStyles}
`;

const UserBadge = styled.div`

  padding: 6px 10px;
  border-radius: 6px;
  ${DesktopControlStyles}
`;

const IconButton = styled.button`

  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
 
  ${DesktopControlStyles}
`;


const PanelWrapper = styled.div`
  position: relative;
  z-index: 20;
  overflow: hidden;

`;


const SlidePanel = styled.div`
  background: #E6E6E6;

`;


const PanelInner = styled.div`
  display: flex;
  gap: 20px;
  padding: 14px;
  align-items: flex-start;
  justify-content: space-between;


`;

const PanelLinks = styled.nav`
  display: flex;
  gap: 25px;
  align-items: center;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 25px;
    align-items: flex-start;
  }
`;

const PanelLink = styled.a`
font-family: Montserrat Alternates;
font-weight: 500;
color:#000000;
font-size: 10px;


text-decoration: none;
`;

const PanelRight = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
  }
`;

const PanelUser = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const UserImg = styled.img`
  width: 40px;
  height: 40px;

  object-fit: cover;
`;
const PanelUserName = styled.div`font-weight:600;`;

const AvatarButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
`;


const Primary = styled.button`

font-family: Montserrat Alternates;
font-weight: 400;

font-size: 10px;
width: 107px;
height: 35px;


  background: #FFB36C;
  color: #000;
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;

  @media (min-width: 768px) { font-size: 12px; }
  @media (min-width: 1200px) { font-size: 14px; } {height: 37px; width: 114px;}
`;


const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  z-index: 120;
`;
const Dialog = styled.div`
  width: 100%;
  max-width: 420px;
  background: #fff;
  padding: 18px;
  border-radius: 6px;
`;
const DialogTitle = styled.h3`margin: 0 0 12px 0;
`;
const SignUpForm = styled.form`

border-radius:25px;

font-family: Montserrat Alternates;
font-weight: 500;

font-size: 15px;




width :293px;
height: 454px;
display:flex;
 flex-direction:column;
  gap:12px;
  justify-content:center;
  align-items:center;

  @media (min-width: 768px) {width: 400px;
height: 440px;}
`;
const Label = styled.label`


font-size: 12px;




display:flex; 
flex-direction:column;
justify-content:center;
align-items:flex-start;
margin-bottom:10px;`;


const Input = styled.input`

font-family: Montserrat;
font-weight: 500;

font-size: 12px;



display:block;
 width: 243px;
 height: 30px;
 border-radius:10px;
 border : none;
 background-color:#E4E4E4;
 padding:8px; 
 margin-top:6px;
 
 @media (min-width: 768px) {width: 310px; height: 30px;}
 @media (min-width: 1200px) {width: 440px; height: 35px;}`;

const FormActions = styled.div`display:flex; justify-content:flex-end; margin-top:12px;`;

const ProfileBody = styled.div`display:flex; flex-direction:column; gap:12px;`;
const ProfileName = styled.div`background:#f7f7f7; padding:8px; border-radius:6px;`;
const ProfileActions = styled.div`display:flex; justify-content:flex-end; gap:8px;`;
