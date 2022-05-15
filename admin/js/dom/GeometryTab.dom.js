jQuery(document).ready(function ($) {
    const $geometryTabPanel = $("#geometry-tab-panel");
    const $geometryBtn = $('a[href="#geometry-tab"]');

    $geometryTabPanel
        .find('[data-scope="geometry"]')
        .on("change input", function (event) {
            const feedHistory = event.type == "change";
            const option = $(this).data("option");
            const dataType = $(this).data("type");

            if (this.id !== "geometry-points-field") {
                let value = this[dataType == "Bool" ? "checked" : "value"];

                if (dataType == "Float" || dataType == "Int") {
                    value = eval(`parse${dataType}(value)`);
                }

                window.ThreeDModelEditor.selected.geometry.set(
                    option,
                    value,
                    feedHistory
                );
            } else {
                window.ThreeDModelEditor.selected.geometry.set(
                    "points",
                    points.get(),
                    feedHistory
                );
            }
        });

    $geometryTabPanel.on("sync", function () {
        if (!window.ThreeDModelEditor.selected.hasScope("geometry")) {
            $geometryBtn.hide();
            $geometryTabPanel.find('div[id*="-row"]').hide();
            return;
        } else {
            $geometryBtn.show();
        }

        $geometryTabPanel.find('div[id*="-row"]').hide();

        const geometryType =
            window.ThreeDModelEditor.selected.geometry.get("type");
        const selectedRows = JSON.parse($(`#${geometryType}-rows`).val());

        selectedRows.forEach((attribute) => {
            const $row = $geometryTabPanel.find(`#geometry-${attribute}-row`);

            $row.find("[data-option]").each(function () {
                const dataOpt = $(this).data("option");
                const dataType = $(this).data("type");
                const optValue =
                    window.ThreeDModelEditor.selected.geometry.get(dataOpt);

                switch (true) {
                    case this.id == "geometry-points-field":
                        points.start($row[0]);
                        points.render(
                            window.ThreeDModelEditor.selected.geometry.get(
                                "points"
                            )
                        );
                        break;

                    case this.tagName == "INPUT":
                        this[dataType == "Bool" ? "checked" : "value"] =
                            optValue;
                        break;

                    default:
                        this.innerHTML = optValue;
                        break;
                }
            });

            $row.show();
        });
    });

    window.ThreeDModelEditor.on("historyChange", () =>
        $geometryTabPanel.trigger("sync")
    );
    window.ThreeDModelEditor.on("select", () => $geometryTabPanel.trigger("sync"));
    window.ThreeDModelEditor.on("unselect", () => $geometryTabPanel.trigger("sync"));
    window.ThreeDModelEditor.on("editSelected", () =>
        $geometryTabPanel.trigger("sync")
    );
});
