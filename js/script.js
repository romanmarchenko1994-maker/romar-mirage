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

                        await loadNews();

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

                        await loadNews();

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
                alert(news.message || "Не удалось загрузить новости.");
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

            await loadNews();

        } catch (error) {
            alert("Не удалось подключиться к серверу.");
        }
    });

    async function initNews() {
        try {
            const response = await fetch("/api/me");
            const user = await response.json();

            isAdmin = user.isAdmin === true;

            if (newsForm && !isAdmin) {
                newsForm.style.display = "none";
            }

            await loadNews();

        } catch (error) {
            console.error("Ошибка проверки прав администратора:", error);
        }
    }

    initNews();
}


// ==============================
// ИСТОРИИ СВИТКА
// ==============================

const storiesList = document.getElementById("stories-list");

if (storiesList) {
    async function loadStories() {
        try {
            const response = await fetch("/api/scrolls/shadows/stories");
            const stories = await response.json();

            if (!response.ok) {
                console.error("Ошибка загрузки историй:", stories.message);
                return;
            }

            storiesList.innerHTML = "";

            if (stories.length === 0) {
                storiesList.innerHTML = `
                    <div class="stories-empty">
                        <p>Истории пока не добавлены.</p>
                    </div>
                `;

                return;
            }

            stories.forEach(function (story) {
                const card = document.createElement("a");
                card.className = "story-card";
                card.href = `/reader?id=${story.id}`;

                const image = document.createElement("img");
                image.src = story.cover_image;
                image.alt = story.title;

                const title = document.createElement("h2");
                title.textContent = story.title;

                card.appendChild(image);
                card.appendChild(title);

                storiesList.appendChild(card);
            });

        } catch (error) {
            console.error("Ошибка загрузки историй:", error);
        }
    }

    loadStories();
}

// ==============================
// ДОБАВЛЕНИЕ ИСТОРИИ
// ==============================

const storyAdmin = document.getElementById("story-admin");
const storyScroll = document.getElementById("story-scroll");
const storyTitle = document.getElementById("story-title");
const storyImages = document.getElementById("story-images");
const storyFiles = document.getElementById("story-files");
const uploadStoryButton = document.getElementById("upload-story");
const storyUploadMessage = document.getElementById("story-upload-message");

if (
    storyAdmin &&
    storyScroll &&
    storyTitle &&
    storyImages &&
    storyFiles &&
    uploadStoryButton &&
    storyUploadMessage
) {
    fetch("/api/me")
        .then(response => response.json())
        .then(user => {
            if (user.isAdmin === true) {
                storyAdmin.style.display = "block";
            }
        })
        .catch(error => {
            console.error("Ошибка проверки прав администратора:", error);
        });

    storyImages.addEventListener("change", function () {
        const files = Array.from(storyImages.files);

        if (files.length === 0) {
            storyFiles.textContent = "";
            return;
        }

        storyFiles.innerHTML = files
            .map(file => file.name)
            .join("<br>");
    });

    async function getImageKitAuth() {
        const response = await fetch("/api/imagekit/auth");
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Не удалось получить доступ к загрузке.");
        }

        return result;
    }

    async function uploadFileToImageKit(file, storyId, sortOrder) {
        const auth = await getImageKitAuth();

        const formData = new FormData();

        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("publicKey", auth.publicKey);
        formData.append("signature", auth.signature);
        formData.append("expire", auth.expire);
        formData.append("token", auth.token);
        formData.append(
            "folder",
            `/romar-mirage/stories/${storyId}`
        );
        formData.append("useUniqueFileName", "false");
        formData.append("overwriteFile", "true");

        const response = await fetch(
            "https://upload.imagekit.io/api/v1/files/upload",
            {
                method: "POST",
                body: formData
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Не удалось загрузить изображение."
            );
        }

        return {
            url: result.url,
            sortOrder: sortOrder
        };
    }

    uploadStoryButton.addEventListener("click", async function () {
        const title = storyTitle.value.trim();
        const files = Array.from(storyImages.files);

        storyUploadMessage.textContent = "";

        if (title === "") {
            storyUploadMessage.textContent =
                "Введите название истории.";
            return;
        }

        if (files.length === 0) {
            storyUploadMessage.textContent =
                "Выберите изображения истории.";
            return;
        }

        const invalidFile = files.find(function (file) {
            return !file.name.toLowerCase().endsWith(".webp");
        });

        if (invalidFile) {
            storyUploadMessage.textContent =
                "Можно загружать только WebP-файлы.";
            return;
        }

        files.sort(function (a, b) {
            return a.name.localeCompare(
                b.name,
                undefined,
                { numeric: true, sensitivity: "base" }
            );
        });

        uploadStoryButton.disabled = true;
        storyUploadMessage.textContent =
            "Создаём историю...";

        try {
            const storyResponse = await fetch("/api/stories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    scrollSlug: storyScroll.value,
                    title: title
                })
            });

            const storyResult = await storyResponse.json();

            if (!storyResponse.ok) {
                throw new Error(storyResult.message);
            }

            const uploadedImages = [];

            for (let i = 0; i < files.length; i++) {
                storyUploadMessage.textContent =
                    `Загрузка изображения ${i + 1} из ${files.length}...`;

                const image = await uploadFileToImageKit(
                    files[i],
                    storyResult.id,
                    i + 1
                );

                uploadedImages.push(image);
            }

            storyUploadMessage.textContent =
                "Сохраняем историю...";

            const imagesResponse = await fetch(
                `/api/stories/${storyResult.id}/images`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        images: uploadedImages
                    })
                }
            );

            const imagesResult = await imagesResponse.json();

            if (!imagesResponse.ok) {
                throw new Error(imagesResult.message);
            }

            storyTitle.value = "";
            storyImages.value = "";
            storyFiles.innerHTML = "";

            storyUploadMessage.textContent =
                "История успешно добавлена.";

            window.location.reload();

        } catch (error) {
            console.error("Ошибка добавления истории:", error);

            storyUploadMessage.textContent =
                error.message || "Не удалось добавить историю.";

        } finally {
            uploadStoryButton.disabled = false;
        }
    });
}