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

interface BillingEmailProps {
  name: string;
  planName: string;
  amount: string;
  dashboardUrl: string;
}

export const BillingEmail = ({ name, planName, amount, dashboardUrl }: BillingEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment Confirmation - Your {planName} Plan is Now Active</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Successful! 💰</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>
          Thank you for upgrading to the <strong>{planName}</strong> plan! Your payment of{' '}
          <strong>${amount}</strong> has been successfully processed.
        </Text>
        <Section style={buttonContainer}>
          <Link href={dashboardUrl} style={button}>
            Go to Dashboard →
          </Link>
        </Section>
        <Text style={text}>
          You now have access to:
        </Text>
        <Text style={listItem}>
          • {planName === 'Starter' ? '15' : '50'} ebook generations per month
        </Text>
        <Text style={listItem}>
          • {planName === 'Starter' ? '6' : '12'} chapters per ebook
        </Text>
        {planName === 'Pro' && (
          <Text style={listItem}>• Priority generation speed</Text>
        )}
        <Text style={listItem}>• No watermark on exports</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Need to manage your subscription? Visit your{' '}
          <Link href={`${dashboardUrl}/profile`}>Account Settings</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

// Reuse styles from WelcomeEmail
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