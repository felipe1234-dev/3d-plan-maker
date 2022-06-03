jQuery(document).ready(function($) {
    const $materialTabPanel = $("#material-tab-panel");
    const $materialBtn = $('a[href="#material-tab"]');
    const $materialSelector = $("#material-list-selector");
    const $opacity = $("#field-opacity");
    const $alphaTest = $("#field-alphaTest");
    const $textareas = $materialTabPanel.find('textarea[data-type="JSON"]');

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
    
    $materialSelector.on("syncUI", function () {
        const $this = $(this);
        $this.html("");

        let materials = PlanMaker.editor.selected.ref.material;
        materials = Array.isArray(materials) ? materials : [ materials ];
        
        materials.forEach((material, i) => {
            const isSelected =
                material === PlanMaker.editor.selected.material.ref
                    ? " selected"
                    : "";

            $this.append(`
                <option value="${i}"${isSelected}>
                    ${material.name ? material.name : `Material Sem Nome ${i + 1}`}
                </option>
            `);
        });
    });
    
    $textareas.each(function () {
        const option = $(this).data("option");

		const $textArea = $(this);
        const $panel = $textArea.parent();
        const $enable = $panel.find(`#material-${option}-enable`);
        const $mapping = $panel.find(`#material-${option}-mappingSelector`);
        const $hasRefr = $panel.find(`#material-${option}-enableRefraction`);
        const $image = $panel.find(`#material-${option}-uploader`);

        $textArea.on("syncUI", function (event, params) {
            if (!params) {
                params = { type: "None" };
            }
            
            const { type: mapType, ...rest } = params;

            $enable[0].disabled = mapType == "None";
            $enable[0].checked = mapType !== "None";

            if ($mapping.length) {
                $mapping[0].value = mapType;
				$mapping.trigger("syncSelectTagHelper");
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

        $textArea.on("update", function () {
            if (!$enable[0].checked) {
                const params = { type: "None" };
                
                $(this).val(JSON.stringify(params));

                PlanMaker.editor.selected.material.set(option, params);
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

            PlanMaker.editor.selected.material.set(option, params);
            $(this).trigger("syncUI", [params]);
        });

        $enable.change(() => {
			$textArea.trigger("update");
		});
	
        if ($mapping.length) {
            $mapping.change(() => {
				if (!$enable[0].checked) {
					return;
				}
				
				$textArea.trigger("update");
			});
        }
	
        if ($hasRefr.length) {
            $hasRefr.change(() => {
				if (!$enable[0].checked) {
					return;
				}
				
				$textArea.trigger("update");
			});
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

    $materialTabPanel.on("sync", function () {
        if (!PlanMaker.editor.selected.hasScope("material")) {
            $materialBtn.hide();
            $materialTabPanel.find('div[id*="-row"]').hide();
            return;
        } else {
            $materialBtn.show();
        }

        $materialTabPanel.find('div[id*="-row"]').hide();

        const materialType = PlanMaker.editor.selected.material.get("type");
        const selectedRows = JSON.parse($(`#${materialType}-rows`).val());

        selectedRows.forEach((attribute) => {
            const $row = $materialTabPanel.find(`#material-${attribute}-row`);

            $row.find("[data-option]").each(function() {
                const dataOpt  = $(this).data("option");
                const optValue = PlanMaker.editor.selected.material.get(dataOpt);
                const dataType = $(this).data("type");

                switch (true) {
                    case this.id == "material-list-selector":
                        $(this).trigger("syncUI");
                        break;
            
                    case this.id == "material-selector":
                        $(this).trigger("syncUI");
                        break;
                    
                    case this.tagName == "INPUT":
                        this[dataType == "Bool" ? "checked" : "value"] = optValue;
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

    $materialTabPanel.find('[data-scope="material"]').on("change input", function (event) {
        const feedHistory = event.type == "change";
        const option = $(this).data("option");
        const dataType = $(this).data("type");

        switch (true) {
            case this.id == "material-list-selector":
                PlanMaker.editor.selected.material.select(parseInt(this.value));
                $materialTabPanel.trigger("sync");
                break;
            
            case this.id == "material-type-selector":
                PlanMaker.editor.selected.material.set(
                    "type",
                    this.value,
                    feedHistory
                );
                $materialTabPanel.trigger("sync");
                break;

            case this.tagName == "SELECT":
                PlanMaker.editor.selected.material.set(
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

                PlanMaker.editor.selected.material.set(
                    option,
                    value,
                    feedHistory
                );
                break;

            default:
                break;
        }
    });

    PlanMaker.editor.on("historyChange", () =>
        $materialTabPanel.trigger("sync")
    );
    PlanMaker.editor.on("select", () => 
        $materialTabPanel.trigger("sync")
    );
    PlanMaker.editor.on("unselect", () => 
        $materialTabPanel.trigger("sync")
    );
    PlanMaker.editor.on("editSelected", () =>
        $materialTabPanel.trigger("sync")
    );
});
