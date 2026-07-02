'use strict';

const Blog = require('@models/Blog');
const User = require('@models/User');
const { BLOG_DEFAULTS } = require('./blogDefaults');

async function seedPublishedBlogs() {
  const author = await User.findOne({
    role: { $in: ['superadmin', 'admin', 'manager'] },
  }).sort({ createdAt: 1 });

  if (!author) return;

  const publishedAt = new Date('2025-08-24T00:00:00.000Z');

  for (const item of BLOG_DEFAULTS) {
    const exists = await Blog.findOne({ slug: item.slug });

    if (!exists) {
      await Blog.create({
        ...item,
        author: author._id,
        status: 'published',
        publishedAt: item.slug === 'red-blotchy-reactive-skincare-routine'
          ? new Date('2025-05-05T00:00:00.000Z')
          : publishedAt,
      });
      continue;
    }

    const patch = {};
    if (!exists.articleIntro && item.articleIntro) patch.articleIntro = item.articleIntro;
    if (!(exists.articleSections || []).length && item.articleSections?.length) {
      patch.articleSections = item.articleSections;
    }
    if (Object.keys(patch).length) {
      await Blog.updateOne({ _id: exists._id }, { $set: patch });
    }
  }
}

module.exports = { seedPublishedBlogs };
