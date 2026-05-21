import * as React from "react";
import { Html, Head, Body, Container, Text, Heading, Section, Button, Hr } from "@react-email/components";

interface TransferRequestTemplateProps {
  requesterName: string;
  productName: string;
  sku: string;
  quantity: number;
  fromBranch: string;
  toBranch: string;
  notes?: string;
  loginUrl: string;
}

export const TransferRequestTemplate: React.FC<TransferRequestTemplateProps> = ({
  requesterName, productName, sku, quantity, fromBranch, toBranch, notes, loginUrl,
}) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>TPAPOS</Text>
        </Section>
        <Section style={badge}>
          <Text style={badgeText}>TRANSFER REQUEST</Text>
        </Section>
        <Heading style={h1}>Stock transfer requested</Heading>
        <Text style={text}>
          <strong style={{ color: "#F1F0FF" }}>{requesterName}</strong> has requested a stock transfer that needs your approval.
        </Text>
        <Section style={detailBox}>
          <Text style={detailLabel}>Product</Text>
          <Text style={detailValue}>{productName} <span style={{ color: "#5C5A7A", fontSize: "12px" }}>({sku})</span></Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Quantity</Text>
          <Text style={{ ...detailValue, color: "#7C3AED" }}>{quantity}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>From Branch</Text>
          <Text style={detailValue}>{fromBranch}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>To Branch</Text>
          <Text style={detailValue}>{toBranch}</Text>
          {notes && (
            <>
              <Hr style={divider} />
              <Text style={detailLabel}>Notes</Text>
              <Text style={{ ...detailValue, color: "#A09EC0" }}>{notes}</Text>
            </>
          )}
        </Section>
        <Text style={text}>Review and approve or reject this request in the inventory section.</Text>
        <Button style={btn} href={loginUrl}>
          Review Transfer
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
const badge = { background: "#7C3AED20", border: "1px solid #7C3AED40", borderRadius: "6px", padding: "6px 12px", display: "inline-block", marginBottom: "16px" };
const badgeText = { color: "#A78BFA", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", margin: "0" };
const h1 = { color: "#F1F0FF", fontSize: "20px", fontWeight: "bold", margin: "0 0 12px" };
const text = { color: "#A09EC0", fontSize: "14px", lineHeight: "22px", margin: "0 0 12px" };
const detailBox = { background: "#12122A", border: "1px solid #2A2A45", borderRadius: "10px", padding: "20px", margin: "20px 0" };
const detailLabel = { color: "#5C5A7A", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 2px" };
const detailValue = { color: "#F1F0FF", fontSize: "14px", fontWeight: "600", margin: "0 0 8px" };
const divider = { borderColor: "#1E1E35", margin: "10px 0" };
const btn = { background: "#7C3AED", color: "#fff", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "inline-block", margin: "8px 0 20px" };
const footer = { color: "#3A3A60", fontSize: "11px", margin: "16px 0 0" };
