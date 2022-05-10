jQuery(document).ready(function ($) {
    const $objectTab = $("#object-tab");
    const $objectBtn = $('a[href="#object-tab"]');

    $objectTab
        .find('[data-scope="object"]')
        .on("change input", function (event) {
            const feedHistory = event.type == "change";
            const option = $(this).data("option");
            const dataType = $(this).data("type");

            let value = this[dataType == "Bool" ? "checked" : "value"];

            if (dataType == "Float" || dataType == "Int") {
                value = eval(`parse${dataType}(value)`);
            }

            window.ThreeDModelEditor.selected.object.set(
                option,
                value,
                feedHistory
            );
        });

    $objectTab.on("sync", function () {
        if (!window.ThreeDModelEditor.selected.hasScope("object")) {
            $objectBtn.hide();
            $objectTab.find('div[id*="-row"]').hide();
            return;
        } else {
            $objectBtn.show();
        }

        $objectTab.find('div[id*="-row"]').hide();

        const objectType = window.ThreeDModelEditor.selected.object.get("type");
        const selectedRows = JSON.parse($(`#${objectType}-rows`).val());

        selectedRows.forEach((attribute) => {
            const $row = $objectTab.find(`#object-${attribute}-row`);

            $row.find("[data-option]").each(function () {
                const dataOpt = $(this).data("option");
                const dataType = $(this).data("type");
                const optValue =
                    window.ThreeDModelEditor.selected.object.get(dataOpt);

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

    window.ThreeDModelEditor.on("historyChange", () =>
        $objectTab.trigger("sync")
    );
    window.ThreeDModelEditor.on("select", () => $objectTab.trigger("sync"));
    window.ThreeDModelEditor.on("unselect", () => $objectTab.trigger("sync"));
    window.ThreeDModelEditor.on("editSelected", () =>
        $objectTab.trigger("sync")
    );
});
