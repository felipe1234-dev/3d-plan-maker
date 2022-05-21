jQuery(document).ready(function ($) {
    const $sceneTabPanel = $("#scene-tab-panel");
    const $bgPanel = $("#bg-selector-panel");
    const $bgSelectBox = $bgPanel.find("#bg-type-selector");
    const $bgImageBox = $bgPanel.find("#bg-image");
    const $bgColorBox = $bgPanel.find("#bg-color");

    $bgSelectBox.on("updateBackground", function (event, feedHistory = true) {
        const bgImage = $bgImageBox
            .css("background-image")
            .replace("url(", "")
            .replace(")", "")
            .replace(/\"/g, "");
        const bgProj = $bgSelectBox.val();
        const bgColor = $bgColorBox.val();

        if (
            !["None", "Color"].includes(bgProj) &&
            (["none", "undefined"].includes(bgImage) || !bgImage)
        ) {
            return;
        }

        const params = {};
        params.type = bgProj;

        if (bgProj == "Color") {
            params.color = bgColor;
        }

        if (bgProj == "UVTexture" || bgProj == "EquirectangularTexture") {
            params.url = bgImage;
        }

        PlanMaker.editor.scene.set("background", params, feedHistory);
    });

    $bgImageBox.click(function () {
        textureUploader.createUploader({
            imageBox: this,
            textureType: $bgSelectBox.val(),
            textureLabel: `${$bgSelectBox.val()} para o pano de fundo`,
            callback: () => $bgSelectBox.trigger("updateBackground"),
        });

        textureUploader.open();
    });

    $bgSelectBox.change(function () {
        $bgImageBox.css("background-image", "");
        $bgSelectBox.trigger("updateBackground");
    });

    $bgColorBox.on("change input", function (event) {
        $bgSelectBox.trigger("updateBackground", [event.type == "change"]);
    });

    $sceneTabPanel.on("sync", function () {
        const {
            type: bgType,
            object: bgObject,
            ...rest
        } = PlanMaker.editor.scene.get("background");
        $bgSelectBox.val(bgType.replace(/mapping/i, "Texture"));

        if (bgObject) {
            if (bgObject.isColor) {
                $bgColorBox.val(rest.color);
            } else if (bgObject.isTexture) {
                const urls = JSON.parse($bgImageBox.data("all-uploads"));
                $bgImageBox.css("background-image", `url("${urls[0]}")`);
            }
        }

        $bgSelectBox.trigger("syncSelectTagHelper");
    });

    PlanMaker.editor.on("historyChange", () =>
        $sceneTabPanel.trigger("sync")
    );
});
