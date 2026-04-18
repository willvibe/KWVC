const express = require('express');
const router = express.Router();
const db = require('../config/database');

async function getCategories() {
    try {
        const [configs] = await db.query('SELECT config_value FROM site_configs WHERE config_key = ?', ['categories']);
        if (configs.length > 0 && configs[0].config_value) {
            return configs[0].config_value.split('\n').filter(c => c.trim());
        }
    } catch (err) {
        console.error(err);
    }
    return ['智慧教育', '数字商业', '智慧城市', '健康医疗', '开放创新'];
}

router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/my');
    res.render('auth/login', { title: '用户登录 - 凯文杯VibeCoding大赛', error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Raw input username:', username);
        console.log('Raw input password:', password);
        if (!username || !password) {
            return res.render('auth/login', { title: '用户登录', error: '请输入用户名、手机号或邮箱和密码' });
        }
        const sql = 'SELECT * FROM users WHERE (username = ? OR phone = ? OR email = ?) AND password = ?';
        console.log('SQL Query:', sql);
        console.log('SQL Params:', [username, username, username, password]);
        const [rows] = await db.query(sql, [username, username, username, password]);
        console.log('Query result count:', rows.length);
        if (rows.length > 0) {
            console.log('Login SUCCESS for user:', rows[0].username);
            req.session.user = { id: rows[0].id, username: rows[0].username, real_name: rows[0].real_name, phone: rows[0].phone, email: rows[0].email, role: rows[0].role };
            if (rows[0].role === 'admin') return res.redirect('/admin/dashboard');
            return res.redirect('/my');
        }
        console.log('Login FAILED - No matching user found');
        res.render('auth/login', { title: '用户登录', error: '用户名、手机号或密码错误' });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.render('auth/login', { title: '用户登录', error: '登录失败，请稍后重试' });
    }
});

router.get('/register', async (req, res) => {
    if (req.session.user) return res.redirect('/my');
    try {
        const cats = await getCategories();
        res.render('auth/register', { title: '注册并报名 - 凯文杯VibeCoding大赛', error: null, formData: {}, categories: cats });
    } catch (err) {
        console.error('Register page error:', err.message, err.stack);
        res.status(500).send('Register page error: ' + err.message);
    }
});

router.post('/register', async (req, res) => {
    try {
        const cats = await getCategories();
        const { username, password, confirm_password, real_name, phone, email, agree_rules,
            gender, id_card, school, college, company_school, occupation,
            project_name, project_category, project_desc, team_members, experience } = req.body;

        // 账号验证
        if (!username || !password || !confirm_password) {
            return res.render('auth/register', { title: '注册并报名', error: '请填写所有必填项', formData: req.body, categories: cats });
        }
        if (username.length < 3) {
            return res.render('auth/register', { title: '注册并报名', error: '用户名至少3个字符', formData: req.body, categories: cats });
        }
        if (password.length < 6) {
            return res.render('auth/register', { title: '注册并报名', error: '密码至少6个字符', formData: req.body, categories: cats });
        }
        if (password !== confirm_password) {
            return res.render('auth/register', { title: '注册并报名', error: '两次密码输入不一致', formData: req.body, categories: cats });
        }

        // 报名信息验证
        const regErrors = [];
        if (!real_name || !real_name.trim()) regErrors.push('真实姓名');
        if (!phone || !phone.trim()) regErrors.push('手机号码');
        if (!email || !email.trim()) regErrors.push('电子邮箱');
        if (!school || !school.trim()) regErrors.push('学校名称');
        if (!college || !college.trim()) regErrors.push('所在学院');
        if (!project_name || !project_name.trim()) regErrors.push('项目名称');

        if (regErrors.length > 0) {
            return res.render('auth/register', { title: '注册并报名', error: '请填写所有必填项：' + regErrors.join('、'), formData: req.body, categories: cats });
        }

        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.render('auth/register', { title: '注册并报名', error: '请输入正确的手机号码', formData: req.body, categories: cats });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.render('auth/register', { title: '注册并报名', error: '请输入正确的邮箱地址', formData: req.body, categories: cats });
        }

        if (!agree_rules) {
            return res.render('auth/register', { title: '注册并报名', error: '请同意大赛规则', formData: req.body, categories: cats });
        }

        const [existingUser] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.render('auth/register', { title: '注册并报名', error: '用户名已存在', formData: req.body, categories: cats });
        }

        const [existingReg] = await db.query('SELECT id FROM registrations WHERE phone = ? OR email = ?', [phone, email]);
        if (existingReg.length > 0) {
            return res.render('auth/register', { title: '注册并报名', error: '该手机号或邮箱已报名，请勿重复报名', formData: req.body, categories: cats });
        }

        // 1. 创建用户
        await db.query('INSERT INTO users (username, password, real_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)', [username, password, real_name, phone, email, 'user']);
        const [newUser] = await db.query('SELECT id FROM users WHERE username = ?', [username]);

        // 2. 创建报名记录
        await db.query(
            `INSERT INTO registrations (name, gender, phone, email, id_card, school, college, company_school, occupation, project_name, project_desc, project_category, team_members, experience)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [real_name, gender || 'male', phone, email, id_card || '', school || '', college || '', company_school || '', occupation || '', project_name, project_desc || '', project_category || '', team_members || '', experience || '']
        );

        // 3. 自动登录
        req.session.user = { id: newUser[0].id, username, real_name, phone, email, role: 'user' };

        res.render('auth/register-success', { title: '报名成功 - 凯文杯VibeCoding大赛' });
    } catch (err) {
        console.error(err);
        res.render('auth/register', { title: '注册并报名', error: '操作失败，请稍后重试', formData: req.body, categories: await getCategories() });
    }
});

module.exports = router;
