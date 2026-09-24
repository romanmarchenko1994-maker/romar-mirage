const readerImage = document.getElementById("reader-image");
const readerCounter = document.getElementById("reader-counter");
const readerPrev = document.getElementById("reader-prev");
const readerNext = document.getElementById("reader-next");
const readerTitle = document.querySelector(".reader-title");

if (
    readerImage &&
    readerCounter &&
    readerPrev &&
    readerNext
) {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get("id");

    let pages = [];
    let currentPage = 0;

    async function loadStory() {
        if (!storyId) {
            readerCounter.textContent = "История не указана.";
            readerPrev.disabled = true;
            readerNext.disabled = true;
            return;
        }

        try {
            const response = await fetch(`/api/stories/${storyId}`);
            const story = await response.json();

            if (!response.ok) {
                throw new Error(
                    story.message || "Не удалось загрузить историю."
                );
            }

            if (!story.images || story.images.length === 0) {
                readerCounter.textContent =
                    "В этой истории пока нет изображений.";

                readerPrev.disabled = true;
                readerNext.disabled = true;

                return;
            }

            pages = story.images.map(function (image) {
                return image.image_url;
            });

            if (readerTitle) {
                readerTitle.textContent = story.title;
            }

            showPage();

        } catch (error) {
            console.error("Ошибка загрузки истории:", error);

            readerCounter.textContent =
                "Не удалось загрузить историю.";

            readerPrev.disabled = true;
            readerNext.disabled = true;
        }
    }

    function showPage() {
        if (pages.length === 0) {
            return;
        }

        readerImage.src = pages[currentPage];

        readerCounter.textContent =
            `${currentPage + 1} / ${pages.length}`;

        readerPrev.disabled = currentPage === 0;
        readerNext.disabled =
            currentPage === pages.length - 1;
    }

    readerPrev.addEventListener("click", function () {
        if (currentPage > 0) {
            currentPage--;
            showPage();
        }
    });

    readerNext.addEventListener("click", function () {
        if (currentPage < pages.length - 1) {
            currentPage++;
            showPage();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
            readerPrev.click();
        }

        if (event.key === "ArrowRight") {
            readerNext.click();
        }
    });

    loadStory();
}