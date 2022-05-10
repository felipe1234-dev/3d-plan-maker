jQuery(document).ready(function ($) {
    const $materialTab = $("#material-tab");
    const $materialBtn = $('a[href="#material-tab"]');
    const $opacity = $("#field-opacity");
    const $alphaTest = $("#field-alphaTest");
    const $textareas = $materialTab.find('textarea[data-type="JSON"]');

    $textareas.each(function () {
        const option = $(this).data("option");

        const $panel = $(this).parent();
        const $enable = $panel.find(`#material-${option}-enable`);
        const $mapping = $panel.find(`#material-${option}-mappingSelector`);
        const $hasRefr = $panel.find(`#material-${option}-enableRefraction`);
        const $image = $panel.find(`#material-${option}-uploader`);

        $(this).on("syncUI", function (event, params) {
            const { type: mapType, ...rest } = params;

            $enable[0].disabled = mapType == "None";
            $enable[0].checked = mapType !== "None";

            if ($mapping.length) {
                $mapping[0].value = mapType;
            }

            if ("urls" in rest) {
                $image
                    .css("background-image", `url("${rest.urls[0]}")`)
                    .data("all-uploads", JSON.stringify(rest.urls));
            } else if ("url" in rest) {
                $image.css("background-image", `url("${rest.url}")`);
            } else {
                $image.css("background-image", "");
            }

            if ($hasRefr.length) {
                $hasRefr[0].checked =
                    "refraction" in rest ? rest.refraction : false;
            }
        });

        $(this).on("update", function () {
            if (!$enable[0].checked) {
                return;
            }

            const params = {};
            params.type = "UVMapping";

            if ($mapping.length) {
                params.type = $mapping.val();
            }

            if (/cube/i.test(params.type)) {
                params.urls = JSON.parse($image.data("all-uploads"));
            } else {
                params.url = $image
                    .css("background-image")
                    .replace("url(", "")
                    .replace(")", "")
                    .replace(/\"/g, "");
            }

            if ($hasRefr.length) {
                params.refraction = $hasRefr[0].checked;
            }

            $(this).val(JSON.stringify(params));

            window.ThreeDModelEditor.selected.material.set(option, params);
            $(this).trigger("syncUI", [params]);
        });

        $enable.change(() => $(this).trigger("update"));
        if ($mapping.length) {
            $mapping.change(() => $(this).trigger("update"));
        }
        if ($hasRefr.length) {
            $hasRefr.change(() => $(this).trigger("update"));
        }
        $image.click(function () {
            textureUploader.createUploader({
                imageBox: this,
                textureType: $mapping ? $mapping.val() : "UVMapping",
                textureLabel: $panel.find(".Panel-title").text().toLowerCase(),
                callback: () => {
                    if ($enable[0].disabled) {
                        $enable[0].disabled = false;
                    }
                    $mapping.trigger("update");
                },
            });
            textureUploader.open();
        });
    });

    $materialTab.on("sync", function () {
        if (!window.ThreeDModelEditor.selected.hasScope("material")) {
            $materialBtn.hide();
            $materialTab.find('div[id*="-row"]').hide();
            return;
        } else {
            $materialBtn.show();
        }

        $materialTab.find('div[id*="-row"]').hide();

        const materialType =
            window.ThreeDModelEditor.selected.material.get("type");
        const selectedRows = JSON.parse($(`#${materialType}-rows`).val());

        selectedRows.forEach((attribute) => {
            const $row = $materialTab.find(`#material-${attribute}-row`);

            $row.find("[data-option]").each(function () {
                const dataOpt = $(this).data("option");
                const optValue =
                    window.ThreeDModelEditor.selected.material.get(dataOpt);
                const dataType = $(this).data("type");

                switch (true) {
                    case this.tagName == "INPUT":
                        this[dataType == "Bool" ? "checked" : "value"] =
                            optValue;
                        break;

                    case this.tagName == "SELECT":
                        this.value = optValue;
                        $(this).trigger("syncSelectTagHelper");
                        break;

                    case dataType == "JSON":
                        $(this).trigger("syncUI", [optValue]);
                        break;

                    default:
                        this.innerHTML = optValue;
                        break;
                }
            });

            $row.show();
        });
    });

    $materialTab
        .find('[data-scope="material"]')
        .on("change input", function (event) {
            const feedHistory = event.type == "change";
            const option = $(this).data("option");
            const dataType = $(this).data("type");

            switch (true) {
                case this.id == "material-type-selector":
                    window.ThreeDModelEditor.selected.material.set(
                        "type",
                        this.value,
                        feedHistory
                    );
                    $materialTab.trigger("sync");
                    break;

                case this.tagName == "SELECT":
                    window.ThreeDModelEditor.selected.material.set(
                        option,
                        this.value,
                        feedHistory
                    );
                    break;

                case this.tagName == "INPUT":
                    let value = this[dataType == "Bool" ? "checked" : "value"];

                    if (dataType == "Float" || dataType == "Int") {
                        value = eval(`parse${dataType}(value)`);
                    }

                    window.ThreeDModelEditor.selected.material.set(
                        option,
                        value,
                        feedHistory
                    );
                    break;

                default:
                    break;
            }
        });

    $alphaTest.change(function () {
        const opacityValue = parseFloat($opacity.val());
        const alphaValue = parseFloat(this.value);
        const step = parseFloat($(this).attr("step"));

        if (alphaValue + step > opacityValue) {
            $opacity.val(alphaValue + step);
        }
    });

    $opacity.change(function () {
        const alphaValue = parseFloat($alphaTest.val());
        const opacityValue = parseFloat(this.value);
        const step = parseFloat($(this).attr("step"));

        if (opacityValue < alphaValue + step) {
            $alphaTest.val(opacityValue - step);
        }
    });

    window.ThreeDModelEditor.on("historyChange", () =>
        $materialTab.trigger("sync")
    );
    window.ThreeDModelEditor.on("select", () => $materialTab.trigger("sync"));
    window.ThreeDModelEditor.on("unselect", () => $materialTab.trigger("sync"));
    window.ThreeDModelEditor.on("editSelected", () =>
        $materialTab.trigger("sync")
    );
});
