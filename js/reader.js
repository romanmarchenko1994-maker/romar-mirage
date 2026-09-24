const readerImage = document.getElementById("reader-image");
const readerCounter = document.getElementById("reader-counter");
const readerPrev = document.getElementById("reader-prev");
const readerNext = document.getElementById("reader-next");

if (
    readerImage &&
    readerCounter &&
    readerPrev &&
    readerNext
) {
    const pages = [
        "images/test-story/01.webp",
        "images/test-story/02.webp",
        "images/test-story/03.webp"
    ];

    let currentPage = 0;

    function showPage() {
        readerImage.src = pages[currentPage];
        readerCounter.textContent =
            `${currentPage + 1} / ${pages.length}`;

        readerPrev.disabled = currentPage === 0;
        readerNext.disabled = currentPage === pages.length - 1;
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

    showPage();
}