// Exact test from Sentry documentation
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://625aadeeddf683313a9726b549126a90@o4510250103406592.ingest.us.sentry.io/4510250105831424",
  sendDefaultPii: true,
});

console.log('Sending test error to Sentry...');

try {
  // This will throw an error because foo() doesn't exist
  foo();
} catch (e) {
  Sentry.captureException(e);
  console.log('✅ Error captured!');
}

// Give Sentry time to send the event
setTimeout(() => {
  console.log('✅ Error should be in Sentry now!');
  console.log('🔗 Check: https://sentry.io/organizations/whatsai/issues/');
  process.exit(0);
}, 3000);
