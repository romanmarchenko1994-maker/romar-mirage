// ==============================
// РЕГИСТРАЦИЯ
// ==============================

const registerForm = document.getElementById("register-form");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const passwordRepeat = document.getElementById("password-repeat").value;
        const message = document.getElementById("register-message");

        if (username === "") {
            message.textContent = "Введите имя пользователя.";
            return;
        }

        if (email === "") {
            message.textContent = "Введите Email.";
            return;
        }

        if (password.length < 6) {
            message.textContent = "Пароль должен содержать минимум 6 символов.";
            return;
        }

        if (password !== passwordRepeat) {
            message.textContent = "Пароли не совпадают.";
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                message.textContent = result.message;
                return;
            }

            message.textContent = result.message;

            registerForm.reset();

            window.location.href = "index.html";

        } catch (error) {
            message.textContent = "Не удалось подключиться к серверу.";
        }
    });
}

// ==============================
// ВХОД
// ==============================

const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const message = document.getElementById("login-message");
        

        if (email === "" || password === "") {
            message.textContent = "Введите Email и пароль.";
            return;
        }

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                message.textContent = result.message;
                return;
            }

            message.textContent = result.message;

            window.location.href = "index.html";

        } catch (error) {
            message.textContent = "Не удалось подключиться к серверу.";
        }
    });
}


// ==============================
// АККАУНТ НА ГЛАВНОЙ
// ==============================

const accountLink = document.getElementById("account-link");
const loginLink = document.getElementById("login-link");
const logoutButton = document.getElementById("logout-button");

async function checkAccount() {
    try {
        const response = await fetch("/api/me");
        const result = await response.json();

        if (result.loggedIn) {
            if (loginLink) {
                loginLink.style.display = "none";
            }

            if (accountLink) {
                accountLink.textContent = result.username;
                accountLink.style.display = "inline";
                accountLink.removeAttribute("href");
            }

            if (logoutButton) {
                logoutButton.style.display = "inline";
            }

        } else {
            if (loginLink) {
                loginLink.style.display = "inline";
            }

            if (accountLink) {
                accountLink.style.display = "inline";
            }

            if (logoutButton) {
                logoutButton.style.display = "none";
            }
        }

    } catch (error) {
        console.error("Ошибка проверки аккаунта:", error);
    }
}

checkAccount();


// ==============================
// ВЫХОД
// ==============================

if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        try {
            const response = await fetch("/api/logout", {
                method: "POST"
            });

            const result = await response.json();

            if (response.ok) {
                window.location.reload();
            } else {
                alert(result.message);
            }

        } catch (error) {
            alert("Не удалось подключиться к серверу.");
        }
    });
}

// ==============================
// НОВОСТИ
// ==============================

const newsText = document.getElementById("news-text");
const addNewsButton = document.getElementById("add-news");
const newsList = document.getElementById("news-list");
const newsForm = document.querySelector(".news-form");

let isAdmin = false;

fetch("/api/me")
    .then(response => response.json())
    .then(user => {
        isAdmin = user.isAdmin === true;

        if (newsForm && !isAdmin) {
            newsForm.style.display = "none";
        }
    });

if (newsText && addNewsButton && newsList) {

    function showNews(news) {
        newsList.innerHTML = "";

        news.forEach(function (item) {
            const article = document.createElement("article");
            article.className = "news-item";

            const text = document.createElement("p");
            text.textContent = item.text;

            const date = document.createElement("time");

            const createdDate = new Date(item.created_at);

            date.textContent = createdDate.toLocaleDateString("ru-RU");

            article.appendChild(text);
            article.appendChild(date);

if (isAdmin) {
    const editButton = document.createElement("button");
    editButton.textContent = "Изменить";
    editButton.type = "button";

    editButton.addEventListener("click", async function () {
        const newText = prompt("Изменить новость:", item.text);

        if (newText === null || newText.trim() === "") {
            return;
        }

        try {
            const response = await fetch(`/api/news/${item.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: newText
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message);
                return;
            }

            loadNews();

        } catch (error) {
            alert("Не удалось подключиться к серверу.");
        }
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Удалить";
    deleteButton.type = "button";

    deleteButton.addEventListener("click", async function () {
        if (!confirm("Удалить эту новость?")) {
            return;
        }

        try {
            const response = await fetch(`/api/news/${item.id}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message);
                return;
            }

            loadNews();

        } catch (error) {
            alert("Не удалось подключиться к серверу.");
        }
    });

    article.appendChild(editButton);
    article.appendChild(deleteButton);
}    
        

            newsList.appendChild(article);
        });
    }


    async function loadNews() {
        try {
            const response = await fetch("/api/news");
            const news = await response.json();

            if (!response.ok) {
                return;
            }

            showNews(news);

        } catch (error) {
            console.error("Ошибка загрузки новостей:", error);
        }
    }


    addNewsButton.addEventListener("click", async function () {
        const text = newsText.value.trim();

        if (text === "") {
            return;
        }

        try {
            const response = await fetch("/api/news", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: text
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message);
                return;
            }

            newsText.value = "";

            loadNews();

        } catch (error) {
            alert("Не удалось подключиться к серверу.");
        }
    });


    loadNews();
}