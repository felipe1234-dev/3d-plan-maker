jQuery(document).ready(function ($) {
    const $objectTabPanel = $("#object-tab-panel");
    const $objectBtn = $('a[href="#object-tab"]');

    $objectTabPanel
        .find('[data-scope="object"]')
        .on("change input", function (event) {
            const feedHistory = event.type == "change";
            const option = $(this).data("option");
            const dataType = $(this).data("type");

            let value = this[dataType == "Bool" ? "checked" : "value"];

            if (dataType == "Float" || dataType == "Int") {
                value = eval(`parse${dataType}(value)`);
            }

            PlanMaker.editor.selected.object.set(
                option,
                value,
                feedHistory
            );
        });

    $objectTabPanel.on("sync", function () {
        if (!PlanMaker.editor.selected.hasScope("object")) {
            $objectBtn.hide();
            $objectTabPanel.find('div[id*="-row"]').hide();
            return;
        } else {
            $objectBtn.show();
        }

        $objectTabPanel.find('div[id*="-row"]').hide();

        const objectType = PlanMaker.editor.selected.object.get("type");
        const selectedRows = JSON.parse($(`#${objectType}-rows`).val());

        selectedRows.forEach((attribute) => {
            const $row = $objectTabPanel.find(`#object-${attribute}-row`);

            $row.find("[data-option]").each(function () {
                const dataOpt = $(this).data("option");
                const dataType = $(this).data("type");
                const optValue =
                    PlanMaker.editor.selected.object.get(dataOpt);

                switch (true) {
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

    PlanMaker.editor.on("historyChange", () =>
        $objectTabPanel.trigger("sync")
    );
    PlanMaker.editor.on("select", () => $objectTabPanel.trigger("sync"));
    PlanMaker.editor.on("unselect", () => $objectTabPanel.trigger("sync"));
    PlanMaker.editor.on("editSelected", () =>
        $objectTabPanel.trigger("sync")
    );
});
