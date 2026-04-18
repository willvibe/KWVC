const express = require('express');
const router = express.Router();
const db = require('../config/database');
const path = require('path');
const fs = require('fs');

function checkAdmin(req, res, next) {
    if (req.session && req.session.admin) return next();
    res.redirect('/admin/login');
}

router.get('/login', (req, res) => {
    res.render('admin/login', { title: '管理员登录', error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND password = ? AND role = ?', [username, password, 'admin']);
        if (rows.length > 0) {
            req.session.admin = { id: rows[0].id, username: rows[0].username, real_name: rows[0].real_name };
            res.redirect('/admin/dashboard');
        } else {
            res.render('admin/login', { title: '管理员登录', error: '用户名或密码错误' });
        }
    } catch (err) {
        console.error(err);
        res.render('admin/login', { title: '管理员登录', error: '登录失败' });
    }
});

router.get('/logout', (req, res) => {
    req.session.admin = null;
    res.redirect('/admin/login');
});

router.get('/dashboard', checkAdmin, async (req, res) => {
    try {
        const [regCount] = await db.query('SELECT COUNT(*) as count FROM registrations');
        const [regPending] = await db.query("SELECT COUNT(*) as count FROM registrations WHERE status = 'pending'");
        const [annCount] = await db.query('SELECT COUNT(*) as count FROM announcements WHERE status = 1');
        const [workTotal] = await db.query('SELECT COUNT(*) as count FROM works');
        const [workApproved] = await db.query("SELECT COUNT(*) as count FROM works WHERE status = 'approved'");
        const [workPending] = await db.query("SELECT COUNT(*) as count FROM works WHERE status = 'submitted'");
        const [workRejected] = await db.query("SELECT COUNT(*) as count FROM works WHERE status = 'rejected'");
        const [recentRegs] = await db.query('SELECT * FROM registrations ORDER BY created_at DESC LIMIT 10');
        const [recentWorks] = await db.query('SELECT w.*, u.username FROM works w LEFT JOIN users u ON w.user_id = u.id ORDER BY w.submitted_at DESC LIMIT 5');
        res.render('admin/dashboard', {
            title: '管理后台',
            regCount: regCount[0].count,
            regPending: regPending[0].count,
            annCount: annCount[0].count,
            workCount: workTotal[0].count,
            workApproved: workApproved[0].count,
            workPending: workPending[0].count,
            workRejected: workRejected[0].count,
            recentRegs,
            recentWorks,
            admin: req.session.admin
        });
    } catch (err) {
        console.error(err);
        res.render('admin/dashboard', {
            title: '管理后台', regCount: 0, regPending: 0, annCount: 0, workCount: 0,
            workApproved: 0, workPending: 0, workRejected: 0,
            recentRegs: [], recentWorks: [], admin: req.session.admin
        });
    }
});

router.get('/registrations', checkAdmin, async (req, res) => {
    try {
        const [r] = await db.query('SELECT * FROM registrations ORDER BY created_at DESC');
        res.render('admin/registrations', { title: '报名管理', registrations: r, admin: req.session.admin });
    } catch (err) {
        console.error(err);
        res.render('admin/registrations', { title: '报名管理', registrations: [], admin: req.session.admin });
    }
});

router.post('/registrations/:id/status', checkAdmin, async (req, res) => {
    try {
        await db.query('UPDATE registrations SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

router.get('/works', checkAdmin, async (req, res) => {
    try {
        const status = req.query.status;
        let query = 'SELECT w.*, u.username, u.real_name FROM works w LEFT JOIN users u ON w.user_id = u.id';
        let params = [];
        if (status && ['submitted', 'approved', 'rejected'].includes(status)) {
            query += ' WHERE w.status = ?';
            params.push(status);
        }
        query += ' ORDER BY w.submitted_at DESC';
        const [w] = await db.query(query, params);
        const [workTotal] = await db.query('SELECT COUNT(*) as count FROM works');
        const [workApproved] = await db.query("SELECT COUNT(*) as count FROM works WHERE status = 'approved'");
        const [workPending] = await db.query("SELECT COUNT(*) as count FROM works WHERE status = 'submitted'");
        const [workRejected] = await db.query("SELECT COUNT(*) as count FROM works WHERE status = 'rejected'");
        res.render('admin/works', {
            title: '作品管理', works: w, admin: req.session.admin,
            currentStatus: status || '',
            workTotal: workTotal[0].count,
            workApproved: workApproved[0].count,
            workPending: workPending[0].count,
            workRejected: workRejected[0].count
        });
    } catch (err) {
        console.error(err);
        res.render('admin/works', {
            title: '作品管理', works: [], admin: req.session.admin,
            currentStatus: '', workTotal: 0, workApproved: 0, workPending: 0, workRejected: 0
        });
    }
});

router.post('/works/:id/status', checkAdmin, async (req, res) => {
    try {
        await db.query('UPDATE works SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

router.get('/users', checkAdmin, async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
        res.render('admin/users', { title: '注册用户', users, admin: req.session.admin });
    } catch (err) {
        console.error(err);
        res.render('admin/users', { title: '注册用户', users: [], admin: req.session.admin });
    }
});

router.post('/users/:id/role', checkAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) return res.json({ success: false });
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

router.post('/users/:id/delete', checkAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM works WHERE user_id = ?', [req.params.id]);
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

router.post('/users/:id/reset-password', checkAdmin, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) return res.json({ success: false });
        await db.query('UPDATE users SET password = ? WHERE id = ?', [password, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

router.get('/announcements', checkAdmin, async (req, res) => {
    try {
        const [a] = await db.query('SELECT * FROM announcements WHERE status = 1 ORDER BY created_at DESC');
        res.render('admin/announcements', { title: '公告管理', announcements: a, admin: req.session.admin });
    } catch (err) {
        console.error(err);
        res.render('admin/announcements', { title: '公告管理', announcements: [], admin: req.session.admin });
    }
});

router.post('/announcements', checkAdmin, async (req, res) => {
    try {
        const { title, content, type, is_top } = req.body;
        await db.query('INSERT INTO announcements (title, content, type, is_top) VALUES (?, ?, ?, ?)', [title, content, type, is_top ? 1 : 0]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

router.post('/announcements/:id/edit', checkAdmin, async (req, res) => {
    try {
        const { title, content, type, is_top } = req.body;
        await db.query('UPDATE announcements SET title = ?, content = ?, type = ?, is_top = ? WHERE id = ?', [title, content, type, is_top ? 1 : 0, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

router.post('/announcements/:id/delete', checkAdmin, async (req, res) => {
    try {
        await db.query('UPDATE announcements SET status = 0 WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

router.get('/site-config', checkAdmin, async (req, res) => {
    try {
        const [configs] = await db.query('SELECT * FROM site_configs ORDER BY id');
        const configMap = {};
        configs.forEach(c => { configMap[c.config_key] = c.config_value; });
        const keys = [
            'hero_title', 'hero_title_size', 'hero_subtitle2', 'hero_subtitle2_size', 'hero_slogan', 'hero_slogan_size',
            'prize_pool', 'track_count', 'judge_count', 'expected_participants',
            'stat_1st_label', 'stat_2nd_label', 'stat_3rd_label', 'stat_4th_label',
            'timeline_registration', 'timeline_development', 'timeline_preliminary', 'timeline_final', 'timeline_award',
            'categories',
            'prize_1st_count', 'prize_1st_name_zh', 'prize_1st_details_zh',
            'prize_2nd_count', 'prize_2nd_name_zh', 'prize_2nd_details_zh',
            'prize_3rd_count', 'prize_3rd_name_zh', 'prize_3rd_details_zh',
            'prize_creative_name_zh', 'prize_creative_details_zh',
            'prize_tech_name_zh', 'prize_tech_details_zh',
            'prize_popular_name_zh', 'prize_popular_details_zh'
        ];
        const config = {};
        keys.forEach(key => { config[key] = configMap[key] || ''; });
        res.render('admin/site-config', { title: '首页设置', config, admin: req.session.admin });
    } catch (err) {
        console.error(err);
        res.render('admin/site-config', { title: '首页设置', config: {}, admin: req.session.admin });
    }
});

router.post('/site-config', checkAdmin, async (req, res) => {
    try {
        console.log('=== SITE CONFIG POST ===');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('stat_1st_label:', req.body.stat_1st_label);
        console.log('stat_2nd_label:', req.body.stat_2nd_label);
        const keys = [
            'hero_title', 'hero_title_size', 'hero_subtitle2', 'hero_subtitle2_size', 'hero_slogan', 'hero_slogan_size',
            'prize_pool', 'track_count', 'judge_count', 'expected_participants',
            'stat_1st_label', 'stat_2nd_label', 'stat_3rd_label', 'stat_4th_label',
            'timeline_registration', 'timeline_development', 'timeline_preliminary', 'timeline_final', 'timeline_award',
            'categories',
            'prize_1st_count', 'prize_1st_name_zh', 'prize_1st_details_zh',
            'prize_2nd_count', 'prize_2nd_name_zh', 'prize_2nd_details_zh',
            'prize_3rd_count', 'prize_3rd_name_zh', 'prize_3rd_details_zh',
            'prize_creative_name_zh', 'prize_creative_details_zh',
            'prize_tech_name_zh', 'prize_tech_details_zh',
            'prize_popular_name_zh', 'prize_popular_details_zh'
        ];
        for (const key of keys) {
            if (req.body[key] !== undefined) {
                await db.query('INSERT INTO site_configs (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?', [key, req.body[key], req.body[key]]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});

router.post('/upload-image', checkAdmin, (req, res) => {
    const upload = req.app.locals.upload;
    upload.single('image')(req, res, function(err) {
        if (err) {
            console.error('Upload error:', err.message);
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: '请选择图片文件' });
        }
        const imageUrl = '/uploads/' + req.file.filename;
        console.log('Image uploaded:', imageUrl);
        res.json({ success: true, url: imageUrl });
    });
});

module.exports = router;