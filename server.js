const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir, { recursive: true });
}
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(session({
    secret: 'kwvc-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

app.locals.upload = upload;

app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.user = req.session.user || null;
    next();
});

const indexRouter = require('./routes/index');
const announcementRouter = require('./routes/announcement');
const registrationRouter = require('./routes/registration');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

app.use('/', indexRouter);
app.use('/announcements', announcementRouter);
app.use('/register', registrationRouter);
app.use('/auth', authRouter);
app.use('/my', userRouter);
app.use('/admin', adminRouter);

app.get('/login', (req, res) => res.redirect('/auth/login'));
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.use((req, res) => {
    res.status(404).render('404', { title: '页面未找到' });
});

app.use((err, req, res, next) => {
    console.error('500 Error:', err.message);
    console.error(err.stack);
    res.status(500).render('error', { title: '服务器错误', error: err });
});

async function startServer() {
    try {
        const connection = await db.getConnection();
        console.log('数据库连接成功！');
        connection.release();
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('数据库连接失败：', err.message);
        process.exit(1);
    }
}

startServer();

module.exports = app;
