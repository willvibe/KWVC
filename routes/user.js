const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('只允许上传PDF文件'));
    }
});

function checkLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    res.redirect('/auth/login');
}

router.get('/', checkLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const [works] = await db.query('SELECT * FROM works WHERE user_id = ? ORDER BY submitted_at DESC', [userId]);
        res.render('user/dashboard', {
            title: '个人中心 - 凯文杯VibeCoding大赛',
            user: req.session.user,
            works,
            currentPath: '/my'
        });
    } catch (err) {
        console.error(err);
        res.render('user/dashboard', {
            title: '个人中心 - 凯文杯VibeCoding大赛',
            user: req.session.user,
            works: [],
            currentPath: '/my'
        });
    }
});

router.get('/submit-work', checkLogin, (req, res) => {
    res.render('user/submit-work', {
        title: '提交作品 - 凯文杯VibeCoding大赛',
        user: req.session.user,
        error: null,
        success: false,
        formData: {},
        currentPath: '/my/submit-work'
    });
});

router.post('/submit-work', checkLogin, upload.single('readme_file'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const [regs] = await db.query("SELECT id, status FROM registrations WHERE phone = (SELECT phone FROM users WHERE id = ?) OR email = (SELECT email FROM users WHERE id = ?)", [userId, userId]);
        const hasApprovedReg = regs.some(r => r.status === 'approved');
        if (regs.length === 0 || !hasApprovedReg) {
            return res.render('user/submit-work', {
                title: '提交作品 - 凯文杯VibeCoding大赛',
                user: req.session.user,
                error: regs.length === 0 ? '您还未报名，请先完成大赛报名' : '您的报名尚未审核通过，请等待审核',
                success: false,
                formData: req.body,
                currentPath: '/my/submit-work'
            });
        }
        const { title, category, demo_url, video_url, tech_platform, description } = req.body;
        if (!title || !category || !demo_url || !video_url) {
            return res.render('user/submit-work', {
                title: '提交作品 - 凯文杯VibeCoding大赛',
                user: req.session.user,
                error: '请填写必填项：作品名称、参赛赛道、在线链接/仓库地址、B站视频链接',
                success: false,
                formData: req.body,
                currentPath: '/my/submit-work'
            });
        }
        if (!req.file) {
            return res.render('user/submit-work', {
                title: '提交作品 - 凯文杯VibeCoding大赛',
                user: req.session.user,
                error: '请上传README.pdf文档',
                success: false,
                formData: req.body,
                currentPath: '/my/submit-work'
            });
        }
        const regId = regs[0].id;
        const readmeUrl = '/uploads/' + req.file.filename;
        await db.query('INSERT INTO works (user_id, registration_id, title, description, category, demo_url, video_url, tech_platform, readme_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [userId, regId, title, description || '', category, demo_url, video_url, tech_platform || '', readmeUrl]);
        res.render('user/submit-work', {
            title: '作品提交成功 - 凯文杯VibeCoding大赛',
            user: req.session.user,
            error: null,
            success: true,
            formData: {},
            currentPath: '/my/submit-work'
        });
    } catch (err) {
        console.error(err);
        res.render('user/submit-work', {
            title: '提交作品 - 凯文杯VibeCoding大赛',
            user: req.session.user,
            error: '提交失败：' + err.message,
            success: false,
            formData: req.body,
            currentPath: '/my/submit-work'
        });
    }
});

router.get('/edit-work/:id', checkLogin, async (req, res) => {
    try {
        const workId = req.params.id;
        const userId = req.session.user.id;
        const [works] = await db.query('SELECT * FROM works WHERE id = ? AND user_id = ?', [workId, userId]);
        if (works.length === 0) {
            return res.redirect('/my');
        }
        const work = works[0];
        if (work.status !== 'submitted') {
            return res.redirect('/my');
        }
        res.render('user/edit-work', {
            title: '编辑作品 - 凯文杯VibeCoding大赛',
            user: req.session.user,
            work,
            currentPath: '/my'
        });
    } catch (err) {
        console.error(err);
        res.redirect('/my');
    }
});

router.post('/edit-work/:id', checkLogin, upload.single('readme_file'), async (req, res) => {
    try {
        const workId = req.params.id;
        const userId = req.session.user.id;
        const [works] = await db.query('SELECT * FROM works WHERE id = ? AND user_id = ?', [workId, userId]);
        if (works.length === 0) {
            return res.redirect('/my');
        }
        const work = works[0];
        if (work.status !== 'submitted') {
            return res.redirect('/my');
        }
        const { title, category, demo_url, video_url, tech_platform, description } = req.body;
        if (!title || !category || !demo_url || !video_url) {
            return res.render('user/edit-work', {
                title: '编辑作品 - 凯文杯VibeCoding大赛',
                user: req.session.user,
                work: { ...work, ...req.body },
                error: '请填写必填项：作品名称、参赛赛道、在线链接/仓库地址、B站视频链接',
                currentPath: '/my'
            });
        }
        let readmeUrl = work.readme_url;
        if (req.file) {
            readmeUrl = '/uploads/' + req.file.filename;
        }
        await db.query('UPDATE works SET title = ?, description = ?, category = ?, demo_url = ?, video_url = ?, tech_platform = ?, readme_url = ? WHERE id = ?', [title, description || '', category, demo_url, video_url, tech_platform || '', readmeUrl, workId]);
        res.redirect('/my');
    } catch (err) {
        console.error(err);
        res.render('user/edit-work', {
            title: '编辑作品 - 凯文杯VibeCoding大赛',
            user: req.session.user,
            work: { ...work, ...req.body },
            error: '更新失败：' + err.message,
            currentPath: '/my'
        });
    }
});

router.post('/delete-work/:id', checkLogin, async (req, res) => {
    try {
        const workId = req.params.id;
        const userId = req.session.user.id;
        const [works] = await db.query('SELECT * FROM works WHERE id = ? AND user_id = ?', [workId, userId]);
        if (works.length === 0) {
            return res.json({ success: false, message: '作品不存在' });
        }
        const work = works[0];
        if (work.status !== 'submitted') {
            return res.json({ success: false, message: '只有待审核的作品才能删除' });
        }
        await db.query('DELETE FROM works WHERE id = ?', [workId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: '删除失败' });
    }
});

module.exports = router;
