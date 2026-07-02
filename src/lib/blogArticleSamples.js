'use strict';

const REDNESS_INTRO = `If your skin flares red at the slightest provocation — heat, stress, fragrance, or the wrong cleanser — you are not alone. Redness-prone skin is often a sign of a compromised barrier, not simply "sensitive skin."

Understanding why your skin reacts helps you build a routine that calms, protects, and strengthens over time — without stripping or over-treating.

This is your practical, intelligent guide to managing redness-prone skin without triggering it further.`;

const REDNESS_SECTIONS = [
  {
    heading: 'What Causes Redness in Skin?',
    intro: '',
    subheading: '',
    position: 0,
    items: [
      { icon: 'check', title: '', description: 'A weakened skin barrier that loses moisture and lets irritants in' },
      { icon: 'check', title: '', description: 'Over-exfoliation or harsh surfactants that strip natural lipids' },
      { icon: 'check', title: '', description: 'Environmental triggers — UV, pollution, wind, and temperature swings' },
      { icon: 'check', title: '', description: 'Inflammatory responses to fragrance, essential oils, or incompatible actives' },
      { icon: 'check', title: '', description: 'Underlying conditions such as rosacea or dermatitis that need clinical care' },
    ],
  },
  {
    heading: '1. Cleanse Without Compromising Your Barrier',
    intro:
      'The right cleanser removes impurities without leaving skin tight, stripped, or more reactive. For redness-prone skin, think hydration first — never squeaky-clean.',
    subheading: 'Start with:',
    position: 1,
    items: [
      {
        icon: 'check',
        title: 'Copper Peptide Jelly Cleanser',
        description: 'pH-respecting, lightly hydrating, and designed to support barrier comfort.',
      },
      {
        icon: 'check',
        title: '',
        description: 'Avoid foaming cleansers, surfactant-heavy gels, and hot water on the face.',
      },
      {
        icon: 'check',
        title: '',
        description: 'Cleanse only once at night if your skin is very reactive; rinse with lukewarm water in the morning.',
      },
    ],
  },
  {
    heading: '2. Prioritise Barrier-First Serums',
    intro:
      'Redness-prone skin needs repair before correction. Focus on calming, hydrating serums before introducing stronger actives.',
    subheading: 'Best serum options:',
    position: 2,
    items: [
      {
        icon: 'triangle',
        title: 'Eclipta Serum',
        description: 'Supports barrier recovery and helps reduce the look of stress-related redness.',
      },
      {
        icon: 'sun',
        title: 'Saffron & Ectoin Serum',
        description: 'Antioxidant support with ingredients chosen for reactive, dehydrated skin.',
      },
      {
        icon: 'dot',
        title: '',
        description: 'Avoid introducing too many new actives at once — add one product every 1–2 weeks.',
      },
    ],
  },
  {
    heading: '3. Choose Moisturisers That Rebuild and Rebalance',
    intro:
      'Moisturisers for redness should seal in hydration, support lipid balance, and help the skin hold moisture — not sit heavily on the surface.',
    subheading: 'Choose based on your skin\'s current state:',
    position: 3,
    items: [
      {
        icon: 'check',
        title: 'Trehalose Water Cream',
        description: 'Lightweight hydration for skin that needs comfort without congestion.',
      },
    ],
  },
];

const AGING_INTRO = `As the skin matures, collagen production slows and texture may change. Recognising early signs allows timely intervention with targeted cosmeceutical actives.

This guide outlines what to watch for and how to build a protocol that supports firmness and radiance over time.`;

const AGING_SECTIONS = [
  {
    heading: 'Fine Lines & Texture',
    intro:
      'Expression lines and rougher texture often appear first around the eyes and forehead. UV and lifestyle factors can accelerate these changes.',
    subheading: '',
    position: 0,
    items: [
      {
        icon: 'check',
        title: '',
        description: 'Support collagen with copper peptides and consistent SPF every morning.',
      },
    ],
  },
  {
    heading: 'The Clinical Approach',
    intro:
      'At Double Bay Cosmeceuticals, we focus on high-performance actives at effective concentrations — introduced gradually for long-term resilience.',
    subheading: '',
    position: 1,
    items: [],
  },
];

module.exports = { REDNESS_INTRO, REDNESS_SECTIONS, AGING_INTRO, AGING_SECTIONS };
