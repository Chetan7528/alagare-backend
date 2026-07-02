'use strict';

/** Footer legal pages — seeded when missing. */
const POLICY_PAGE_DEFAULTS = [
  {
    title: 'Refund Policy',
    slug: 'refund-policy',
    isSystem: true,
    status: 'active',
    content: `<h1>Refund Policy</h1>
<p>Last updated: ${new Date().getFullYear()}</p>
<p>At Double Bay Cosmeceuticals, we want you to be completely satisfied with your purchase. If you are not happy with your order, you may be eligible for a refund or exchange subject to the conditions below.</p>
<h2>Eligibility</h2>
<ul>
<li>Items must be returned within 30 days of delivery.</li>
<li>Products must be unused, unopened, and in original packaging.</li>
<li>Sale or promotional items may be final sale unless required by law.</li>
</ul>
<h2>How to request a refund</h2>
<p>Contact us at <strong>info@doublebay.com</strong> with your order number and reason for return. Our team will provide return instructions within 2 business days.</p>
<h2>Processing time</h2>
<p>Once we receive and inspect your return, refunds are processed within 5–10 business days to your original payment method.</p>
<h2>Contact</h2>
<p>For questions about refunds, email <strong>info@doublebay.com</strong>.</p>`,
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    isSystem: true,
    status: 'active',
    content: `<h1>Privacy Policy</h1>
<p>Last updated: ${new Date().getFullYear()}</p>
<p>Double Bay Cosmeceuticals ("we", "us") respects your privacy. This policy explains how we collect, use, and protect your personal information when you use our website and services.</p>
<h2>Information we collect</h2>
<ul>
<li>Name, email address, phone number, and shipping address when you place an order or create an account.</li>
<li>Payment information processed securely by our payment partners (we do not store full card details).</li>
<li>Usage data such as pages visited, device type, and cookies to improve your experience.</li>
</ul>
<h2>How we use your information</h2>
<ul>
<li>To process orders and provide customer support.</li>
<li>To send order updates and, with your consent, marketing communications.</li>
<li>To improve our website, products, and services.</li>
</ul>
<h2>Sharing your information</h2>
<p>We do not sell your personal data. We may share information with trusted service providers (shipping, payment, email) only as needed to operate our business.</p>
<h2>Your rights</h2>
<p>You may request access, correction, or deletion of your personal data by contacting <strong>info@doublebay.com</strong>.</p>
<h2>Contact</h2>
<p>Questions about this policy: <strong>info@doublebay.com</strong>.</p>`,
  },
  {
    title: 'Shipping Policy',
    slug: 'shipping-policy',
    isSystem: true,
    status: 'active',
    content: `<h1>Shipping Policy</h1>
<p>Last updated: ${new Date().getFullYear()}</p>
<p>We ship orders across Australia and select international destinations. Delivery times and costs are shown at checkout before you complete your purchase.</p>
<h2>Processing time</h2>
<p>Orders are typically processed within 1–2 business days. You will receive a confirmation email with tracking once your order has shipped.</p>
<h2>Domestic shipping (Australia)</h2>
<ul>
<li><strong>Standard shipping:</strong> 3–5 business days (free on qualifying orders).</li>
<li><strong>Express shipping:</strong> 1–2 business days (additional fee applies).</li>
</ul>
<h2>International shipping</h2>
<p>International delivery times vary by destination. Customs duties and taxes may apply and are the responsibility of the recipient.</p>
<h2>Lost or damaged parcels</h2>
<p>If your order arrives damaged or does not arrive within the estimated timeframe, contact <strong>info@doublebay.com</strong> within 14 days of the expected delivery date.</p>
<h2>Contact</h2>
<p>Shipping enquiries: <strong>info@doublebay.com</strong>.</p>`,
  },
  {
    title: 'Terms of Service',
    slug: 'terms-of-service',
    isSystem: true,
    status: 'active',
    content: `<h1>Terms of Service</h1>
<p>Last updated: ${new Date().getFullYear()}</p>
<p>By accessing or using the Double Bay Cosmeceuticals website, you agree to these Terms of Service. Please read them carefully before placing an order.</p>
<h2>Use of our website</h2>
<p>You agree to use this site only for lawful purposes. You must not misuse the site, attempt unauthorised access, or interfere with its operation.</p>
<h2>Products and information</h2>
<p>Product descriptions and images are provided for general information. Our products are cosmeceutical skincare for cosmetic use only unless otherwise stated. Results may vary between individuals.</p>
<h2>Orders and payment</h2>
<p>All orders are subject to acceptance and availability. We reserve the right to cancel orders in cases of pricing errors, stock issues, or suspected fraud.</p>
<h2>Limitation of liability</h2>
<p>To the fullest extent permitted by law, Double Bay Cosmeceuticals is not liable for indirect or consequential loss arising from use of our products or website.</p>
<h2>Governing law</h2>
<p>These terms are governed by the laws of Australia. Disputes shall be subject to the exclusive jurisdiction of Australian courts.</p>
<h2>Contact</h2>
<p>Questions about these terms: <strong>info@doublebay.com</strong>.</p>`,
  },
];

const POLICY_SLUGS = POLICY_PAGE_DEFAULTS.map((p) => p.slug);

module.exports = { POLICY_PAGE_DEFAULTS, POLICY_SLUGS };
