
import React, { useState, useEffect } from "react";
import styled from "styled-components";


const Container = styled.header`

`;

const Left = styled.div`

`;

const Logo = styled.div`

`;

const Nav = styled.nav`

`;

const NavLink = styled.a`

`;

const Right = styled.div`

`;

const SignUpButton = styled.button`

`;

const UserBadge = styled.div`

`;

const IconButton = styled.button`

`;

const Overlay = styled.div`

`;

const Dialog = styled.div`

`;

const HeaderRow = styled.div`

`;

const Title = styled.h2`

`;

const SignUpForm = styled.form`

`;

const Label = styled.label`

`;

const Input = styled.input`

`;

const Actions = styled.div`

`;

const Primary = styled.button`

`;



const BottomText = styled.p`

`;

const Link = styled.a`

`;



const STORAGE_KEY = "app_user";
export function Header() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  return (
    <>
      <Container>
        <Left>
          <Logo></Logo>
          <Nav>
            <NavLink href="#">Who we are</NavLink>
            <NavLink href="#">Contacts</NavLink>
            <NavLink href="#">Menu</NavLink>
          </Nav>
        </Left>

        <Right>
          {user ? (
            <UserBadge>{user.name}</UserBadge>
          ) : (
            <SignUpButton onClick={() => setIsModalOpen(true)}>Sign Up</SignUpButton>
          )}

          <IconButton>
            <svg width="50" height="50" fill="none">
             
            </svg>
          </IconButton>
        </Right>
      </Container>

      {isModalOpen && (
        <Overlay onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <Dialog>
            <HeaderRow>
              <Title>Sign up</Title>
            </HeaderRow>

            <SignUpForm
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const name = (form.elements && form.elements.username && form.elements.username.value) || "";
                if (!name.trim()) return;
                setUser({ name: name.trim() });
                setIsModalOpen(false);
              }}
            >
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

              <Actions>
               
                <Primary type="submit">Sign up</Primary>
              </Actions>

              <BottomText>
                Already have an account? <Link href="#l" onClick={() => setIsModalOpen(false)}>Log In</Link>
              </BottomText>
            </SignUpForm>
          </Dialog>
        </Overlay>
      )}
    </>
  );
}

