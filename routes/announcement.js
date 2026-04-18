const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const type = req.query.type || '';
        let query = 'SELECT * FROM announcements WHERE status = 1';
        const params = [];
        if (type && ['notice', 'news', 'update'].includes(type)) {
            query += ' AND type = ?';
            params.push(type);
        }
        query += ' ORDER BY is_top DESC, created_at DESC';

        const [announcements] = await db.query(query, params);
        res.render('announcements', {
            title: '动态公告 - 凯文杯VibeCoding大赛',
            announcements,
            currentType: type
        });
    } catch (err) {
        console.error(err);
        res.render('announcements', {
            title: '动态公告 - 凯文杯VibeCoding大赛',
            announcements: [],
            currentType: ''
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM announcements WHERE id = ? AND status = 1', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).render('404', { title: '公告未找到' });
        }
        res.render('announcement-detail', {
            title: rows[0].title + ' - 凯文杯VibeCoding大赛',
            announcement: rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { title: '服务器错误', error: err });
    }
});

module.exports = router;
