document.addEventListener("DOMContentLoaded", () => {
	const form = document.querySelector("form");
	const button = form.querySelector("button[type='submit']");

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		button.disabled = true;
		document.body.style.cursor = "wait";

		const statusElement = document.getElementById("status");
		while (statusElement.firstChild) {
			statusElement.firstChild.remove();
		}

		const csrfToken = document.querySelector("input[name='csrf_token']").value;

		try {
			const response = await fetch(window.location.href, {
				method: "POST",
				headers: {
					"X-CSRFToken": csrfToken,
				},
			});

			if (!response.ok) {
				addStatusMessage(
					statusElement,
					"Could not make network request",
					"error",
				);
				return;
			}

			const data = await response.json();
			addStatusMessage(statusElement, data.message, data.category);
		} catch (error) {
			addStatusMessage(statusElement, error, "error");
		} finally {
			button.disabled = false;
			document.body.style.cursor = "default";
		}
	});
});

function addStatusMessage(parentElement, message, category) {
	const divElement = document.createElement("div");
	divElement.classList.add("page-status-message");
	divElement.classList.add(category);
	if (category === "error") {
		const prefixElement = document.createElement("strong");
		const textElement = document.createTextNode("Error: ");
		prefixElement.appendChild(textElement);
		divElement.appendChild(prefixElement);
	}
	const textNode = document.createTextNode(message);
	divElement.appendChild(textNode);
	parentElement.appendChild(divElement);
}
