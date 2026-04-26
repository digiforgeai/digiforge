import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export const WelcomeEmail = ({ name, loginUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to DigiForgeAI - Start Forging Your Digital Products</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to DigiForgeAI, {name}! 🚀</Heading>
        <Text style={text}>
          We're thrilled to have you on board. You've just taken the first step toward
          creating amazing digital products with AI.
        </Text>
        <Section style={buttonContainer}>
          <Link href={loginUrl} style={button}>
            Start Forging →
          </Link>
        </Section>
        <Text style={text}>
          With DigiForgeAI, you can:
        </Text>
        <Text style={listItem}>
          • Generate professional ebooks in minutes
        </Text>
        <Text style={listItem}>
          • Access AI-powered trend research
        </Text>
        <Text style={listItem}>
          • Export to PDF and DOCX formats
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Need help? Reply to this email or contact us at support@digiforgeai.app
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, Helvetica, sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6e6e6',
  borderRadius: '8px',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
};

const listItem = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0 8px 20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  padding: '12px 32px',
  display: 'inline-block',
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '20px 0',
};

const footer = {
  color: '#888888',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '20px 0 0',
  textAlign: 'center' as const,
};