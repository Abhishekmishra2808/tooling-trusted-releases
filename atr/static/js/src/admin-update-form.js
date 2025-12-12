/*
 *  Licensed to the Apache Software Foundation (ASF) under one
 *  or more contributor license agreements.  See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership.  The ASF licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

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
		prefixElement.append(textElement);
		divElement.append(prefixElement);
	}
	const textNode = document.createTextNode(message);
	divElement.append(textNode);
	parentElement.append(divElement);
}
