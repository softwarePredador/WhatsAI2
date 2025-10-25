// Import Sentry at the very top, before everything else
import * as Sentry from "@sentry/node";

// Initialize Sentry
Sentry.init({
  dsn: "https://625aadeeddf683313a9726b549126a90@o4510250103406592.ingest.us.sentry.io/4510250105831424",
  
  // Environment
  environment: process.env['NODE_ENV'] || 'development',

  // Send structured logs to Sentry
  enableLogs: true,

  // Tracing - Capture 100% in dev, 10% in production
  tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,

  // Send IP addresses for better user tracking
  sendDefaultPii: true,

  // Before send hook to filter sensitive data
  beforeSend(event) {
    // Remove sensitive data from breadcrumbs and context
    if (event.request?.data) {
      const data = event.request.data as any;
      if (data.password) data.password = '[FILTERED]';
      if (data.token) data.token = '[FILTERED]';
      if (data.apiKey) data.apiKey = '[FILTERED]';
    }
    return event;
  },
});

console.log('✅ Sentry initialized (error tracking + performance monitoring)');
