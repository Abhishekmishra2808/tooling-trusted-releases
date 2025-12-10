document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("issue-jwt-form");
    const output = document.getElementById("jwt-output");
    if (!form || !output) {
        return;
    }
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const resp = await fetch(form.action, {
            method: "POST",
            body: new FormData(form),
        });
        if (resp.ok) {
            const token = await resp.text();
            output.classList.remove("d-none");
            output.textContent = token;
        }
        else {
            alert("Failed to fetch JWT");
        }
    });
});
//# sourceMappingURL=create-a-jwt.js.map