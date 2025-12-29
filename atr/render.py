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

from typing import Literal

import htpy

import atr.get as get
import atr.htm as htm
import atr.util as util

type Phase = Literal["COMPOSE", "VOTE", "FINISH"]


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
    tabs.append(_variables_tab_button(tab_id_prefix))

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

    variables_pane = _variables_tab(tab_id_prefix, template_variables)

    tab_content = htm.div(f"#{tab_id_prefix}-tab-content.tab-content")[edit_pane, preview_pane, variables_pane]

    return htm.div[tabs.collect(), tab_content]


def html_nav(container: htm.Block, back_url: str, back_anchor: str, phase: Phase) -> None:
    classes = ".d-flex.justify-content-between.align-items-center"
    block = htm.Block(htm.p, classes=classes)
    block.a(".atr-back-link", href=back_url)[f"← Back to {back_anchor}"]
    span = htm.Block(htm.span, classes=".atr-phase-nav")

    def _phase(actual: Phase, expected: Phase) -> None:
        match expected:
            case "COMPOSE":
                symbol = "①"
            case "VOTE":
                symbol = "②"
            case "FINISH":
                symbol = "③"
        if actual == expected:
            span.strong(f".atr-phase-{actual}.atr-phase-symbol")[symbol]
            span.span(f".atr-phase-{actual}.atr-phase-label")[actual]
        else:
            span.span(".atr-phase-symbol-other")[symbol]

    _phase(phase, "COMPOSE")
    span.span(".atr-phase-arrow")["→"]
    _phase(phase, "VOTE")
    span.span(".atr-phase-arrow")["→"]
    _phase(phase, "FINISH")

    block.append(span.collect(separator=" "))
    container.append(block)


def html_nav_phase(block: htm.Block, project: str, version: str, staging: bool) -> None:
    label: Phase
    route, label = (get.compose.selected, "COMPOSE")
    if not staging:
        route, label = (get.finish.selected, "FINISH")
    html_nav(
        block,
        util.as_url(
            route,
            project_name=project,
            version_name=version,
        ),
        back_anchor=f"{label.title()} {project} {version}",
        phase=label,
    )


def _variables_tab(
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


def _variables_tab_button(tab_id_prefix: str) -> htm.Element:
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
