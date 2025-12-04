# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

import htpy

import atr.htm as htm


def body_tabs(
    tab_id_prefix: str,
    default_body: str,
    template_variables: list[tuple[str, str]],
) -> htm.Element:
    tabs = htm.Block(htm.ul(f"#{tab_id_prefix}-tab.nav.nav-tabs", role="tablist"))
    tabs.li(".nav-item", role="presentation")[
        htpy.button(
            f"#edit-{tab_id_prefix}-tab.nav-link.active",
            data_bs_toggle="tab",
            data_bs_target=f"#edit-{tab_id_prefix}-pane",
            type="button",
            role="tab",
            aria_controls=f"edit-{tab_id_prefix}-pane",
            aria_selected="true",
        )["Edit"]
    ]
    tabs.li(".nav-item", role="presentation")[
        htpy.button(
            f"#preview-{tab_id_prefix}-tab.nav-link",
            data_bs_toggle="tab",
            data_bs_target=f"#preview-{tab_id_prefix}-pane",
            type="button",
            role="tab",
            aria_controls=f"preview-{tab_id_prefix}-pane",
            aria_selected="false",
        )["Text preview"]
    ]
    tabs.append(variables_tab_button(tab_id_prefix))

    edit_pane = htm.div(f"#edit-{tab_id_prefix}-pane.tab-pane.fade.show.active", role="tabpanel")[
        htpy.textarea(
            "#body.form-control.font-monospace.mt-2",
            name="body",
            rows="12",
        )[default_body]
    ]

    preview_pane = htm.div(f"#preview-{tab_id_prefix}-pane.tab-pane.fade", role="tabpanel")[
        htm.pre(".mt-2.p-3.bg-light.border.rounded.font-monospace.overflow-auto")[
            htm.code(f"#{tab_id_prefix}-preview-content")["Loading preview..."]
        ]
    ]

    variables_pane = variables_tab(tab_id_prefix, template_variables)

    tab_content = htm.div(f"#{tab_id_prefix}-tab-content.tab-content")[edit_pane, preview_pane, variables_pane]

    return htm.div[tabs.collect(), tab_content]


def copy_javascript() -> str:
    # TODO: We need to ensure that all JS files are standalone
    # We have far too many embedded snippets
    return """
        document.querySelectorAll(".copy-var-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const variable = btn.dataset.variable;
                navigator.clipboard.writeText(variable).then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = "Copied!";
                    btn.classList.remove("btn-outline-secondary");
                    btn.classList.add("btn-success");
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.classList.remove("btn-success");
                        btn.classList.add("btn-outline-secondary");
                    }, 1500);
                });
            });
        });
    """


def variables_tab(
    tab_id_prefix: str,
    template_variables: list[tuple[str, str]],
) -> htm.Element:
    variable_rows = []
    for name, description in template_variables:
        variable_rows.append(
            htm.tr[
                htm.td(".font-monospace.text-nowrap")[f"[{name}]"],
                htm.td[description],
                htm.td(".text-end")[
                    htpy.button(
                        ".btn.btn-sm.btn-outline-secondary.copy-var-btn",
                        type="button",
                        data_variable=f"[{name}]",
                    )["Copy"]
                ],
            ]
        )

    variables_table = htm.table(".table.table-sm.mt-2")[
        htm.thead[
            htm.tr[
                htm.th["Variable"],
                htm.th["Description"],
                htm.th[""],
            ]
        ],
        htm.tbody[*variable_rows],
    ]

    return htm.div(f"#{tab_id_prefix}-variables-pane.tab-pane.fade", role="tabpanel")[variables_table]


def variables_tab_button(tab_id_prefix: str) -> htm.Element:
    return htm.li(".nav-item", role="presentation")[
        htpy.button(
            f"#{tab_id_prefix}-variables-tab.nav-link",
            data_bs_toggle="tab",
            data_bs_target=f"#{tab_id_prefix}-variables-pane",
            type="button",
            role="tab",
            aria_controls=f"{tab_id_prefix}-variables-pane",
            aria_selected="false",
        )["Variables"]
    ]
