'use strict';

const REDNESS_ARTICLE = `<p>If your skin flares red at the slightest provocation — heat, stress, fragrance, or the wrong cleanser — you are not alone. Redness-prone skin is often a sign of a compromised barrier, not simply "sensitive skin."</p>
<p>Understanding why your skin reacts helps you build a routine that calms, protects, and strengthens over time — without stripping or over-treating.</p>
<p>This is your practical, intelligent guide to managing redness-prone skin without triggering it further.</p>
<hr />
<h2>What Causes Redness in Skin?</h2>
<ul>
<li>A weakened skin barrier that loses moisture and lets irritants in</li>
<li>Over-exfoliation or harsh surfactants that strip natural lipids</li>
<li>Environmental triggers — UV, pollution, wind, and temperature swings</li>
<li>Inflammatory responses to fragrance, essential oils, or incompatible actives</li>
<li>Underlying conditions such as rosacea or dermatitis that need clinical care</li>
</ul>
<p>Redness is often a <strong>sign of skin fatigue</strong> — your barrier asking for support, not more aggression.</p>
<hr />
<h2>1. Cleanse Without Compromising Your Barrier</h2>
<p>The right cleanser removes impurities without leaving skin tight, stripped, or more reactive. For redness-prone skin, think hydration first — never squeaky-clean.</p>
<p><strong>Start with:</strong></p>
<ul>
<li><strong>Copper Peptide Jelly Cleanser</strong> — pH-respecting, lightly hydrating, and designed to support barrier comfort.</li>
<li>Avoid foaming cleansers, surfactant-heavy gels, and hot water on the face.</li>
<li>Cleanse only once at night if your skin is very reactive; rinse with lukewarm water in the morning.</li>
</ul>
<hr />
<h2>2. Prioritise Barrier-First Serums</h2>
<p>Redness-prone skin needs repair before correction. Focus on calming, hydrating serums before introducing stronger actives.</p>
<p><strong>Best serum options:</strong></p>
<ul>
<li><strong>Eclipta Serum</strong> — supports barrier recovery and helps reduce the look of stress-related redness.</li>
<li><strong>Saffron &amp; Ectoin Serum</strong> — antioxidant support with ingredients chosen for reactive, dehydrated skin.</li>
<li>Avoid introducing too many new actives at once — add one product every 1–2 weeks.</li>
</ul>
<hr />
<h2>3. Choose Moisturisers That Rebuild and Rebalance</h2>
<p>Moisturisers for redness should seal in hydration, support lipid balance, and help the skin <strong>hold moisture</strong> — not sit heavily on the surface.</p>
<p><strong>Choose based on your skin's current state:</strong></p>
<ul>
<li><strong>Trehalose Water Cream</strong> — lightweight hydration for skin that needs comfort without congestion.</li>
<li><strong>Amino Lotion</strong> — ideal when skin feels tight but not oily.</li>
<li><strong>Blacred Lotion</strong> — supports very dry, reactive skin that needs richer comfort.</li>
<li><strong>Persea Lotion</strong> — nourishing option for compromised barriers in cooler months.</li>
</ul>
<hr />
<h2>4. Watch for These Common Redness Triggers in Your Routine</h2>
<p>Many well-meaning routines trigger redness unintentionally. Here are a few subtle offenders to look for:</p>
<ul>
<li>Over-exfoliating with acids or scrubs more than 1–2 times per week</li>
<li>Mixing strong Vitamin C and retinol on the same night without guidance</li>
<li>Fragranced skincare — including essential oils marketed as "natural"</li>
</ul>
<hr />
<h2>5. Build a Calming Routine That Feels Gentle—But Still Works</h2>
<p>Redness-prone skin needs <strong>consistency, rhythm, and restraint.</strong> Try this routine rhythm:</p>
<p><strong>Morning</strong></p>
<ul>
<li>Copper Peptide Jelly Cleanser (or water rinse only)</li>
<li>Saffron &amp; Ectoin Serum</li>
<li>Trehalose Water Cream</li>
<li>SPF 50+ — non-negotiable</li>
</ul>
<p><strong>Evening</strong></p>
<ul>
<li>Copper Peptide Jelly Cleanser</li>
<li>Eclipta Serum</li>
<li>Trehalose Water Cream or Amino Lotion</li>
</ul>`;

const BEST_SELLING_ARTICLE = `<p>Our best-selling protocols combine clinical actives with textures your skin can tolerate daily. These are the formulas clients repurchase most — because they deliver visible results without unnecessary irritation.</p>
<p>Whether you are new to cosmeceuticals or refining an existing routine, start with one hero product and build slowly.</p>
<hr />
<h2>Why These Products Lead</h2>
<ul>
<li>Evidence-backed actives at effective concentrations</li>
<li>Textures designed for layering under SPF and makeup</li>
<li>Formulated without unnecessary fillers or heavy fragrance</li>
</ul>
<hr />
<h2>How to Build Your Protocol</h2>
<p><strong>Start with:</strong></p>
<ul>
<li><strong>Copper Peptide Jelly Cleanser</strong> — gentle daily cleanse</li>
<li><strong>Intense Copper Binding GHK-Cu Repair Serum</strong> — firmness and repair</li>
<li><strong>Trehalose Water Cream</strong> — seal and protect</li>
</ul>
<p>Add actives one at a time. Consistency over 6–8 weeks reveals the best outcomes.</p>`;

const SHORT_ARTICLE = `<p>Targeted solutions for this concern start with barrier support, consistent SPF, and actives introduced gradually.</p>
<p>Explore the full range on our shop page or speak with your clinician about a personalised protocol.</p>
<hr />
<h2>Clinical approach</h2>
<ul>
<li>Cleanse gently — never strip the skin</li>
<li>Hydrate before correcting</li>
<li>Protect with SPF every morning</li>
</ul>`;

const CONCERN_DEFAULTS = [
  {
    title: 'Best Selling',
    slug: 'best-selling',
    cardImage: '/images/pd1.png',
    heroImage: '/images/blogslug.png',
    content: BEST_SELLING_ARTICLE,
    isNew: true,
    position: 0,
  },
  {
    title: "Red, Blotchy, Reactive? Here's the Best Skincare Routine for Calming Redness Fast",
    slug: 'red-blotchy-reactive-skincare-routine',
    cardImage: '/images/pd4.png',
    heroImage: '/images/blogslug.png',
    content: REDNESS_ARTICLE,
    isNew: true,
    position: 1,
  },
  {
    title: 'New Releases',
    slug: 'new-releases',
    cardImage: '/images/pd2.png',
    heroImage: '/images/blogslug.png',
    content: SHORT_ARTICLE,
    position: 2,
  },
  {
    title: 'Pores and Texture',
    slug: 'pores-and-texture',
    cardImage: '/images/pd3.png',
    heroImage: '/images/blogslug.png',
    content: SHORT_ARTICLE,
    position: 3,
  },
  {
    title: 'Fine Lines',
    slug: 'fine-lines',
    cardImage: '/images/pd4.png',
    heroImage: '/images/blogslug.png',
    content: SHORT_ARTICLE,
    position: 4,
  },
  {
    title: 'Hydration',
    slug: 'hydration',
    cardImage: '/images/pd5.png',
    heroImage: '/images/blogslug.png',
    content: SHORT_ARTICLE,
    position: 5,
  },
  {
    title: 'Brightening',
    slug: 'brightening',
    cardImage: '/images/pd16.png',
    heroImage: '/images/blogslug.png',
    content: SHORT_ARTICLE,
    position: 6,
  },
  {
    title: 'Sensitivity',
    slug: 'sensitivity',
    cardImage: '/images/pd7.png',
    heroImage: '/images/blogslug.png',
    content: SHORT_ARTICLE,
    position: 7,
  },
  {
    title: 'SPF',
    slug: 'spf',
    cardImage: '/images/pd8.png',
    heroImage: '/images/blogslug.png',
    content: SHORT_ARTICLE,
    position: 8,
  },
];

const SLUG_ALIASES = {
  'best-product-selling': 'best-selling',
  'best-products-selling': 'best-selling',
};

module.exports = { CONCERN_DEFAULTS, SLUG_ALIASES, REDNESS_ARTICLE, BEST_SELLING_ARTICLE };
