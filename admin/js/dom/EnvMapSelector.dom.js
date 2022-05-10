jQuery(document).ready(function ($) {
    const $sceneTab = $("#scene-tab");
    const $mapPanel = $("#env-map-panel");
    const $mapSelectBox = $("#env-map-type-selector");
    const $mapImageBox = $mapPanel.find("#env-map-image");
    const $mapHasRefr = $mapPanel.find("#env-map-has-refraction");

    $mapSelectBox.on("updateEnvMap", function () {
        const mapImage = $mapImageBox
            .css("background-image")
            .replace("url(", "")
            .replace(")", "")
            .replace(/\"/g, "");
        const uploads = JSON.parse($mapImageBox.data("all-uploads"));
        const mapProj = $mapSelectBox.val();
        const hasRefr = $mapHasRefr[0].checked;

        if (
            mapProj !== "None" &&
            (["none", "undefined"].includes(mapImage) || !mapImage)
        ) {
            return;
        }

        const params = {};
        params.type = mapProj;

        if (["UVMapping", "EquirectangularMapping"].includes(mapProj)) {
            params.url = mapImage;
        }

        if (["CubeMapping", "CubeUVMapping"].includes(mapProj)) {
            params.urls = uploads[0];
        }

        if (mapProj !== "UVMapping" && mapProj !== "None") {
            params.refraction = hasRefr;
        }

        window.ThreeDModelEditor.scene.set("environment", params);
    });

    $mapHasRefr.change(function () {
        $mapSelectBox.trigger("updateEnvMap");
    });

    $mapSelectBox.change(function () {
        $mapImageBox.css("background-image", "");
        $mapSelectBox.trigger("updateEnvMap");
    });

    $mapImageBox.click(function () {
        textureUploader.createUploader({
            imageBox: this,
            textureType: $mapSelectBox.val(),
            textureLabel: `${$mapSelectBox.val()} para o mapa de ambiente`,
            callback: () => $mapSelectBox.trigger("updateEnvMap"),
        });

        textureUploader.open();
    });

    $sceneTab.on("sync", function () {
        const {
            type: mapType,
            object: mapObject,
            ...rest
        } = window.ThreeDModelEditor.scene.get("environment");
        $mapSelectBox.val(mapType);

        if (mapObject) {
            const urls = JSON.parse($mapImageBox.data("all-uploads"));
            $mapImageBox.css("background-image", `url("${urls[0]}")`);

            if (mapType !== "UVMapping") {
                $mapHasRefr[0].checked = rest.refraction;
            }
        }

        $mapSelectBox.trigger("syncSelectTagHelper");
    });

    window.ThreeDModelEditor.on("historyChange", () =>
        $sceneTab.trigger("sync")
    );
});
