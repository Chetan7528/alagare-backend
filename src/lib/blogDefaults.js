'use strict';

const { AGING_INTRO, AGING_SECTIONS, REDNESS_INTRO, REDNESS_SECTIONS } = require('./blogArticleSamples');

const ARTICLE_BODY = `<h2>Fine Lines &amp; Texture</h2>
<p>As the skin matures, the natural production of structural proteins like collagen begins to decelerate. This process often manifests as a loss of volume and the emergence of expression lines, particularly around the orbital area and across the forehead.</p>
<p>Environmental stressors and UV exposure further accelerate this breakdown, leading to a rougher skin texture and a duller complexion. Recognizing these early textural shifts allows for timely intervention with targeted cosmeceutical actives.</p>
<h2>Loss of Elasticity</h2>
<p>Beyond surface texture, aging involves a qualitative change in the skin&apos;s architecture. Elastin fibers—which provide the &quot;snap back&quot; quality of youth—become fragmented and disorganized over time, leading to visible sagging and a lack of tautness.</p>
<h2>The Clinical Approach</h2>
<p>At Double Bay Cosmeceuticals, we advocate for a proactive clinical approach. Rather than waiting for deep-set wrinkles to form, our protocols focus on high-dose copper peptides and barrier-supporting actives to maintain dermal density and support long-term skin resilience.</p>`;

const BLOG_DEFAULTS = [
  {
    title: 'How to recognize the first signs of skin aging?',
    slug: 'how-to-recognize-the-first-signs-of-skin-aging',
    category: 'Patients',
    excerpt:
      'Discover how advanced cosmeceutical skincare is transforming modern beauty routines with science-backed formulations and personalised skin solutions.',
    content: ARTICLE_BODY,
    articleIntro: AGING_INTRO,
    articleSections: AGING_SECTIONS,
    thumbnail: '/images/blog1.png',
    featured: true,
    tags: ['aging', 'patients'],
  },
  {
    title: "Red, Blotchy, Reactive? Here's the Best Skincare Routine for Calming Redness Fast",
    slug: 'red-blotchy-reactive-skincare-routine',
    category: 'Patients',
    excerpt:
      'A practical guide to calming redness-prone skin with barrier-first cleansing, serums, and moisturisers — without triggering further irritation.',
    content: '',
    articleIntro: REDNESS_INTRO,
    articleSections: REDNESS_SECTIONS,
    thumbnail: '/images/blogslug.png',
    featured: false,
    tags: ['redness', 'patients'],
  },
  {
    title: 'Natural contributions, i.e. the key to the highest quality.',
    slug: 'natural-contributions-key-to-highest-quality',
    category: 'Security',
    excerpt: 'Natural contributions and quality sourcing in modern cosmeceutical formulations.',
    content: ARTICLE_BODY,
    thumbnail: '/images/blog2.png',
    featured: false,
    tags: ['quality'],
  },
  {
    title: 'A new line of cosmetics for dry skin is now available.',
    slug: 'new-line-cosmetics-for-dry-skin',
    category: 'Providers',
    excerpt: 'Clinical solutions designed for dry and compromised skin barriers.',
    content: ARTICLE_BODY,
    thumbnail: '/images/blog3.png',
    featured: false,
    tags: ['dry-skin'],
  },
  {
    title: 'Glass Skin Starts With Care',
    slug: 'glass-skin-starts-with-care',
    category: 'Tips',
    excerpt:
      'Achieving a luminous, glass-like complexion is about the right sequence of barrier support and active delivery.',
    content: ARTICLE_BODY,
    thumbnail: '/images/blog4.png',
    featured: false,
    tags: ['tips'],
  },
  {
    title: 'Personalised Skin Solutions',
    slug: 'personalised-skin-solutions',
    category: 'Providers',
    excerpt:
      'Every skin profile is unique. Learn how clinical assessment maps your concerns to evidence-based protocols.',
    content: ARTICLE_BODY,
    thumbnail: '/images/blog5.png',
    featured: false,
    tags: ['providers'],
  },
  {
    title: 'Science-Backed Formulations',
    slug: 'science-backed-formulations',
    category: 'Security',
    excerpt: 'Evidence-based actives and formulation standards at Double Bay.',
    content: ARTICLE_BODY,
    thumbnail: '/images/blog6.png',
    featured: false,
    tags: ['science'],
  },
  {
    title: 'Building Confidence Through Skincare',
    slug: 'building-confidence-through-skincare',
    category: 'Providers',
    excerpt: 'How consistent clinical skincare supports confidence and skin health.',
    content: ARTICLE_BODY,
    thumbnail: '/images/blog7.png',
    featured: false,
    tags: ['providers'],
  },
  {
    title: 'How Advanced Skincare Transforms Skin Health',
    slug: 'how-advanced-skincare-transforms-skin-health',
    category: 'Patients',
    excerpt: 'Advanced protocols for measurable improvement in skin health.',
    content: ARTICLE_BODY,
    thumbnail: '/images/blog8.png',
    featured: false,
    tags: ['patients'],
  },
  {
    title: '5 Signs Your Skin Needs Extra Hydration',
    slug: 'five-signs-your-skin-needs-extra-hydration',
    category: 'Tips',
    excerpt: 'Key signs of dehydration and how to restore optimal skin hydration.',
    content: ARTICLE_BODY,
    thumbnail: '/images/blog9.png',
    featured: false,
    tags: ['hydration', 'tips'],
  },
];

module.exports = { BLOG_DEFAULTS, ARTICLE_BODY };
