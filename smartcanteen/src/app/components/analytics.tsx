// pages/analytics.tsx
import { Analytics } from '@vercel/analytics/react';

const AnalyticsPage = () => {
  return (
    <div>
      <h1>Vercel Web Analytics</h1>
      <p>Welcome to the Vercel Analytics page!</p>
      <Analytics />
    </div>
  );
};

export default AnalyticsPage;
