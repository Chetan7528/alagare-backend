'use strict';

const TERMS_BODY = `<p>Welcome to <strong>Alagare (TransiHub)</strong>. By creating an account or booking a bus ticket through our mobile app, you agree to these Terms of Service.</p>
<h3>1. About our service</h3>
<p>Alagare is a bus booking platform that lets you search routes, compare operators, select seats, and book intercity and local bus travel. We connect you with transport operators on the Alagare network.</p>
<h3>2. Account registration</h3>
<p>You must provide accurate name, email, and phone details. You are responsible for keeping your login credentials secure. You must be at least 18 years old (or have a parent/guardian’s consent) to book tickets.</p>
<h3>3. Bookings and payments</h3>
<p>A booking is confirmed only after successful payment and confirmation from the operator. Fares, taxes, and fees shown at checkout are payable at the time of booking unless otherwise stated. Please review trip details, boarding point, and seat selection before paying.</p>
<h3>4. Cancellations and refunds</h3>
<p>Cancellation and refund rules depend on the operator and fare type selected. Partial or no refund may apply for late cancellations, no-shows, or promotional fares. Refund timelines follow the payment method and operator policy.</p>
<h3>5. Travel and conduct</h3>
<p>Arrive at the boarding point with enough time and a valid ticket (in-app or SMS/email). Follow operator safety rules. Alagare is not liable for delays caused by traffic, weather, mechanical issues, or force majeure, though we will help you with support where possible.</p>
<h3>6. Acceptable use</h3>
<p>You agree not to misuse the app, attempt fraud, scrape data, or interfere with other users or operators. We may suspend accounts that violate these terms.</p>
<h3>7. Changes</h3>
<p>We may update these Terms to reflect new features or legal requirements. Continued use of the app after updates means you accept the revised Terms.</p>
<h3>8. Contact</h3>
<p>For booking help or disputes, use Help &amp; Support in the Alagare app or contact <strong>support@alagare.com</strong>.</p>
<p><em>Last updated: July 2026</em></p>`;

const PRIVACY_BODY = `<p><strong>Alagare (TransiHub)</strong> respects your privacy. This Privacy Policy explains what we collect, how we use it, and your choices when you use our bus booking app.</p>
<h3>1. Information we collect</h3>
<ul>
<li>Account details: name, email, phone number, and profile photo (if you upload one).</li>
<li>Booking details: routes, seats, passenger info, payment references, and travel history.</li>
<li>Device and usage data: app version, device type, approximate location (if you allow it for maps), and crash/diagnostics data to improve reliability.</li>
<li>Support messages you send to customer care.</li>
</ul>
<h3>2. How we use your information</h3>
<p>We use your data to create and manage your account, process bookings, send tickets and trip updates, show maps and boarding points, improve the app, prevent fraud, and respond to support requests.</p>
<h3>3. Sharing</h3>
<p>We share necessary booking details with bus operators to fulfil your trip. Payment processors handle card/UPI transactions securely. We do not sell your personal information. We may share data if required by law or to protect safety and rights.</p>
<h3>4. Data retention</h3>
<p>We keep account and booking records as long as needed for service, legal, and accounting purposes. You may request account deletion from Settings / Support, subject to open bookings and legal retention rules.</p>
<h3>5. Security</h3>
<p>We use industry-standard measures (including encrypted connections and access controls) to protect your data. No method of transmission is 100% secure; please keep your password private.</p>
<h3>6. Your choices</h3>
<p>You can update profile details in the app, control notification preferences, and revoke location permission in device settings. Contact us to access, correct, or delete personal data where applicable.</p>
<h3>7. Children</h3>
<p>Our service is not directed at children under 13. If you believe a child has provided data, contact us and we will take appropriate steps.</p>
<h3>8. Updates</h3>
<p>We may update this Policy from time to time. Material changes will be reflected in the app. Continued use means you acknowledge the updated Policy.</p>
<h3>9. Contact</h3>
<p>Privacy questions: <strong>privacy@alagare.com</strong> or Help &amp; Support in the Alagare app.</p>
<p><em>Last updated: July 2026</em></p>`;

const FAQ_DEFAULTS = [
  {
    question: 'How do I book a bus ticket on Alagare?',
    answer:
      'Open the app, choose From and To cities, pick your travel date, select a bus and seats, then complete payment. You will get a confirmation with your booking ID.',
  },
  {
    question: 'Can I cancel my ticket and get a refund?',
    answer:
      'Yes. Go to My Bookings, open your ticket, and choose Cancel if the fare rules allow it. Refund amount and time depend on the operator and how close you are to departure.',
  },
  {
    question: 'Where can I find my boarding point?',
    answer:
      'Open the confirmed booking in My Bookings. Boarding point, gate, and reporting time are shown on the trip details screen.',
  },
  {
    question: 'I paid but did not get a ticket. What should I do?',
    answer:
      'Check My Bookings first. If the ticket is missing, raise an inquiry under Help & Support with your payment reference and registered email. Our team usually replies within 24 hours.',
  },
  {
    question: 'How do I change my profile details?',
    answer:
      'Go to Profile → Personal Info to update your name, phone number, and photo. Email is used for login and cannot be changed from the app.',
  },
  {
    question: 'Is my payment information safe?',
    answer:
      'Payments are processed through secure payment partners. Alagare does not store your full card or UPI PIN. Never share OTPs or passwords with anyone.',
  },
];

const APP_CONTENT_DEFAULT = {
  termsTitle: 'Terms of Service',
  termsBody: TERMS_BODY,
  privacyTitle: 'Privacy Policy',
  privacyBody: PRIVACY_BODY,
  faqs: FAQ_DEFAULTS,
};

module.exports = { APP_CONTENT_DEFAULT, TERMS_BODY, PRIVACY_BODY, FAQ_DEFAULTS };
