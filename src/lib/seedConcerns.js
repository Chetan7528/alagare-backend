'use strict';

const Concern = require('@models/Concern');
const { CONCERN_DEFAULTS, SLUG_ALIASES } = require('./concernDefaults');

async function seedConcerns() {
  for (const item of CONCERN_DEFAULTS) {
    const exists = await Concern.findOne({ slug: item.slug });

    if (!exists) {
      await Concern.create({ ...item, status: 'active' });
      continue;
    }

    const patch = {};
    if (!exists.content?.trim() && item.content) patch.content = item.content;
    if (!exists.heroImage && item.heroImage) patch.heroImage = item.heroImage;
    if (Object.keys(patch).length) {
      await Concern.updateOne({ _id: exists._id }, { $set: patch });
    }
  }

  for (const [alias, target] of Object.entries(SLUG_ALIASES)) {
    const targetDoc = await Concern.findOne({ slug: target, status: 'active' });
    if (!targetDoc) continue;
    const aliasExists = await Concern.findOne({ slug: alias });
    if (aliasExists) continue;
    await Concern.create({
      title: targetDoc.title,
      slug: alias,
      cardImage: targetDoc.cardImage,
      heroImage: targetDoc.heroImage,
      content: targetDoc.content,
      isNew: false,
      position: targetDoc.position,
      status: 'active',
    });
  }
}

module.exports = { seedConcerns };
