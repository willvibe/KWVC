const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const [configs] = await db.query('SELECT * FROM site_configs');
        const siteConfig = {};
        configs.forEach(c => { siteConfig[c.config_key] = c.config_value; });
        const [announcements] = await db.query(
            'SELECT * FROM announcements WHERE status = 1 ORDER BY is_top DESC, created_at DESC LIMIT 5'
        );
        res.render('index', {
            title: '凯文杯-首届VibeCoding零代码项目创作大赛',
            announcements,
            siteConfig
        });
    } catch (err) {
        console.error(err);
        res.render('index', {
            title: '凯文杯-首届VibeCoding零代码项目创作大赛',
            announcements: [],
            siteConfig: {}
        });
    }
});

router.get('/about', (req, res) => {
    res.render('about', { title: '大赛介绍 - 凯文杯VibeCoding大赛' });
});

module.exports = router;
