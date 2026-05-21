import * as React from "react";
import { Html, Head, Body, Container, Text, Heading, Section, Button, Hr } from "@react-email/components";

interface WelcomeTemplateProps {
  name: string;
  email: string;
  tempPassword: string;
  role: string;
  orgName: string;
  loginUrl: string;
}

export const WelcomeTemplate: React.FC<WelcomeTemplateProps> = ({ name, email, tempPassword, role, orgName, loginUrl }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>TPAPOS</Text>
        </Section>
        <Heading style={h1}>Welcome to {orgName}</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>
          Your account has been created on TPAPOS. You can now sign in and start using the platform.
        </Text>
        <Section style={credBox}>
          <Text style={credLabel}>Email</Text>
          <Text style={credValue}>{email}</Text>
          <Hr style={divider} />
          <Text style={credLabel}>Temporary Password</Text>
          <Text style={credValue}>{tempPassword}</Text>
          <Hr style={divider} />
          <Text style={credLabel}>Role</Text>
          <Text style={credValue}>{role.replace(/_/g, " ")}</Text>
        </Section>
        <Text style={text}>
          Please sign in and change your password as soon as possible.
        </Text>
        <Button style={btn} href={loginUrl}>
          Sign in to TPAPOS
        </Button>
        <Hr style={divider} />
        <Text style={footer}>TPAPOS — Run Every Branch. Own Every Sale.</Text>
      </Container>
    </Body>
  </Html>
);

const main = { backgroundColor: "#0B0B18", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' };
const container = { margin: "0 auto", padding: "32px 24px", maxWidth: "520px" };
const header = { marginBottom: "24px" };
const logo = { color: "#7C3AED", fontSize: "20px", fontWeight: "bold", margin: "0" };
const h1 = { color: "#F1F0FF", fontSize: "22px", fontWeight: "bold", margin: "0 0 16px" };
const text = { color: "#A09EC0", fontSize: "14px", lineHeight: "22px", margin: "0 0 12px" };
const credBox = { background: "#12122A", border: "1px solid #2A2A45", borderRadius: "10px", padding: "20px", margin: "20px 0" };
const credLabel = { color: "#5C5A7A", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 2px" };
const credValue = { color: "#F1F0FF", fontSize: "14px", fontWeight: "600", margin: "0 0 12px", fontFamily: "monospace" };
const divider = { borderColor: "#1E1E35", margin: "12px 0" };
const btn = { background: "#7C3AED", color: "#fff", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block", margin: "8px 0 20px" };
const footer = { color: "#3A3A60", fontSize: "11px", margin: "16px 0 0" };
