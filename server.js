require("dotenv").config();

const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

db.connect()
    .then(() => {
        console.log("Подключение к PostgreSQL успешно.");
    })
    .catch((error) => {
        console.error("Ошибка подключения к PostgreSQL:", error.message);
    });

app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


// ==============================
// РЕГИСТРАЦИЯ
// ==============================

app.post("/api/register", async function (req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Заполните все поля."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Пароль должен содержать минимум 6 символов."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, username, email`,
            [username, email, passwordHash]
        );

        const user = result.rows[0];

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.email = user.email;

        res.json({
            message: "Регистрация успешна."
        });


    } catch (error) {
        if (error.code === "23505") {
            return res.status(400).json({
                message: "Пользователь с таким Email уже существует."
            });
        }

        console.error(error);

        res.status(500).json({
            message: "Ошибка сервера."
        });
    }
});



// ==============================
// ВХОД
// ==============================

app.post("/api/login", async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Введите Email и пароль."
            });
        }

        const result = await db.query(
            `SELECT id, username, email, password_hash
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Неверный Email или пароль."
            });
        }

        const user = result.rows[0];

        const passwordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                message: "Неверный Email или пароль."
            });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({
            message: "Вход выполнен.",
            username: user.username
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Ошибка сервера."
        });
    }
});

// ==============================
// ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
// ==============================

app.get("/api/me", async function (req, res) {
    try {
        if (!req.session.userId) {
            return res.json({
                loggedIn: false
            });
        }

        const result = await db.query(
            `SELECT id, username, email
             FROM users
             WHERE id = $1`,
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            req.session.destroy();

            return res.json({
                loggedIn: false
            });
        }

        const user = result.rows[0];

        res.json({
            loggedIn: true,
            username: user.username,
            email: user.email,
            isAdmin: user.email === process.env.ADMIN_EMAIL
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Ошибка сервера."
        });
    }
});

// ==============================
// ВЫХОД
// ==============================

app.post("/api/logout", function (req, res) {
    req.session.destroy(function (error) {
        if (error) {
            console.error(error);

            return res.status(500).json({
                message: "Не удалось выйти из аккаунта."
            });
        }

        res.json({
            message: "Выход выполнен."
        });
    });
});

// ==============================
// НОВОСТИ
// ==============================

app.get("/api/news", async function (req, res) {
    try {
        const result = await db.query(
            `SELECT id, text, created_at
             FROM news
             ORDER BY created_at DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Не удалось загрузить новости."
        });
    }
});


app.post("/api/news", async function (req, res) {
    try {
        if (!req.session.userId) {
            return res.status(403).json({
                message: "Добавлять новости может только администратор."
            });
        }

        const userResult = await db.query(
            `SELECT email
             FROM users
             WHERE id = $1`,
            [req.session.userId]
        );

        if (
            userResult.rows.length === 0 ||
            userResult.rows[0].email !== process.env.ADMIN_EMAIL
        ) {
            return res.status(403).json({
                message: "Добавлять новости может только администратор."
            });
        }

        const { text } = req.body;

        if (!text || text.trim() === "") {
            return res.status(400).json({
                message: "Введите текст новости."
            });
        }

        const result = await db.query(
            `INSERT INTO news (text)
             VALUES ($1)
              RETURNING id, text, created_at`,
            [text.trim()]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Не удалось добавить новость."
        });
    }
});

app.listen(PORT, "0.0.0.0", function () {
    console.log(`Сайт запущен: http://localhost:${PORT}`);
});