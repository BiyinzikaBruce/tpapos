import * as React from "react";
import { Html, Head, Body, Container, Text, Heading, Section, Button, Hr } from "@react-email/components";

interface LowStockTemplateProps {
  productName: string;
  branchName: string;
  currentQty: number;
  threshold: number;
  sku: string;
  loginUrl: string;
}

export const LowStockTemplate: React.FC<LowStockTemplateProps> = ({ productName, branchName, currentQty, threshold, sku, loginUrl }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>TPAPOS</Text>
        </Section>
        <Section style={alertBadge}>
          <Text style={alertText}>LOW STOCK ALERT</Text>
        </Section>
        <Heading style={h1}>{productName} is running low</Heading>
        <Text style={text}>
          Stock at <strong style={{ color: "#F1F0FF" }}>{branchName}</strong> has dropped below your configured threshold.
        </Text>
        <Section style={statsBox}>
          <div style={statRow}>
            <Text style={statLabel}>Current Stock</Text>
            <Text style={{ ...statValue, color: "#EF4444" }}>{currentQty}</Text>
          </div>
          <Hr style={divider} />
          <div style={statRow}>
            <Text style={statLabel}>Threshold</Text>
            <Text style={statValue}>{threshold}</Text>
          </div>
          <Hr style={divider} />
          <div style={statRow}>
            <Text style={statLabel}>SKU</Text>
            <Text style={{ ...statValue, fontFamily: "monospace" }}>{sku}</Text>
          </div>
          <Hr style={divider} />
          <div style={statRow}>
            <Text style={statLabel}>Branch</Text>
            <Text style={statValue}>{branchName}</Text>
          </div>
        </Section>
        <Text style={text}>Restock this item to avoid running out of stock.</Text>
        <Button style={btn} href={loginUrl}>
          Manage Inventory
        </Button>
        <Hr style={divider} />
        <Text style={footer}>TPAPOS — Run Every Branch. Own Every Sale.</Text>
      </Container>
    </Body>
  </Html>
);

const main = { backgroundColor: "#0B0B18", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' };
const container = { margin: "0 auto", padding: "32px 24px", maxWidth: "520px" };
const header = { marginBottom: "16px" };
const logo = { color: "#7C3AED", fontSize: "20px", fontWeight: "bold", margin: "0" };
const alertBadge = { background: "#EF444420", border: "1px solid #EF444440", borderRadius: "6px", padding: "6px 12px", display: "inline-block", marginBottom: "16px" };
const alertText = { color: "#EF4444", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", margin: "0" };
const h1 = { color: "#F1F0FF", fontSize: "20px", fontWeight: "bold", margin: "0 0 12px" };
const text = { color: "#A09EC0", fontSize: "14px", lineHeight: "22px", margin: "0 0 12px" };
const statsBox = { background: "#12122A", border: "1px solid #2A2A45", borderRadius: "10px", padding: "20px", margin: "20px 0" };
const statRow = { display: "flex" as const, justifyContent: "space-between" as const, alignItems: "center" as const };
const statLabel = { color: "#5C5A7A", fontSize: "12px", margin: "0" };
const statValue = { color: "#F1F0FF", fontSize: "14px", fontWeight: "600", margin: "0" };
const divider = { borderColor: "#1E1E35", margin: "12px 0" };
const btn = { background: "#7C3AED", color: "#fff", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block", margin: "8px 0 20px" };
const footer = { color: "#3A3A60", fontSize: "11px", margin: "16px 0 0" };
