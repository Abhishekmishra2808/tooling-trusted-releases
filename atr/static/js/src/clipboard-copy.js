document.addEventListener("DOMContentLoaded", () => {
	const copyButtons = document.querySelectorAll(".atr-copy-btn");

	copyButtons.forEach((button) => {
		button.addEventListener("click", function () {
			const targetId = this.getAttribute("data-clipboard-target");
			const targetElement = document.querySelector(targetId);

			if (targetElement) {
				const textToCopy = targetElement.textContent;

				navigator.clipboard
					.writeText(textToCopy)
					.then(() => {
						const originalText = this.innerHTML;
						this.innerHTML = '<i class="bi bi-check"></i> Copied!';

						setTimeout(() => {
							this.innerHTML = originalText;
						}, 2000);
					})
					.catch((err) => {
						console.error("Failed to copy: ", err);
						this.innerHTML =
							'<i class="bi bi-exclamation-triangle"></i> Failed!';

						setTimeout(() => {
							this.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
						}, 2000);
					});
			}
		});
	});
});
