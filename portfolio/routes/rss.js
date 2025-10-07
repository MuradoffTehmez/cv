const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'portfolio',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});

// RSS feed üçün XML yaradır
const generateRssFeed = (posts, siteUrl, siteTitle, siteDescription) => {
    const items = posts.map(post => {
        const pubDate = new Date(post.published_at || post.created_at).toUTCString();
        const postUrl = `${siteUrl}/post-detail.html?slug=${post.slug}`;

        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt || post.content.substring(0, 200) + '...'}]]></description>
      <author><![CDATA[${post.author_username}]]></author>
    </item>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle}</title>
    <link>${siteUrl}</link>
    <description>${siteDescription}</description>
    <language>az</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
};

// RSS feed endpoint
router.get('/', async (req, res) => {
    try {
        // Son 50 dərc olunmuş məqaləni əldə et
        const result = await pool.query(`
            SELECT p.id, p.title, p.content, p.excerpt, p.slug, p.published_at, p.created_at,
                   u.username as author_username
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'published'
            ORDER BY p.published_at DESC, p.created_at DESC
            LIMIT 50
        `);

        const siteUrl = process.env.SITE_URL || 'http://localhost:5000';
        const siteTitle = process.env.SITE_TITLE || 'Portfolio Blog';
        const siteDescription = process.env.SITE_DESCRIPTION || 'Personal portfolio and blog';

        const rssFeed = generateRssFeed(result.rows, siteUrl, siteTitle, siteDescription);

        res.set('Content-Type', 'application/rss+xml; charset=UTF-8');
        res.send(rssFeed);
    } catch (error) {
        console.error('RSS feed xətası:', error);
        res.status(500).send('RSS feed yaradılarkən xəta baş verdi');
    }
});

module.exports = router;
