jQuery(document).ready(function ($) {
    const $sceneTab = $("#scene-tab");
    const $fogPanel = $("#fog-selector-panel");
    const $fogSelector = $fogPanel.find("#fog-type-selector");
    const $fogColor = $fogPanel.find("#fog-color");
    const $fogNear = $fogPanel.find("#fog-near");
    const $fogFar = $fogPanel.find("#fog-far");
    const $fogDensity = $fogPanel.find("#fog-density");

    $fogSelector.on("updateFog", function (event, feedHistory = true) {
        const fogType = $fogSelector.val();
        const params = {};
        params.type = fogType;

        if (fogType == "Linear") {
            params.near = parseFloat($fogNear.val());
            params.far = parseFloat($fogFar.val());
        }

        if (fogType == "Exponential") {
            params.density = parseFloat($fogDensity.val());
        }

        if (["Linear", "Exponential"].includes(fogType)) {
            params.color = $fogColor.val();
        }

        window.ThreeDModelEditor.scene.set("fog", params, feedHistory);
    });

    $fogSelector.change(function () {
        $fogSelector.trigger("updateFog");
    });

    $fogPanel.find("input").on("change input", function (event) {
        $fogSelector.trigger("updateFog", event.type == "change");
    });

    $sceneTab.on("sync", function () {
        const { type: fogType, ...rest } =
            window.ThreeDModelEditor.scene.get("fog");

        $fogSelector.val(fogType);
        $fogColor.val("color" in rest ? rest.color : "#000");
        $fogNear.val(fogType == "Linear" ? rest.near : "5");
        $fogFar.val(fogType == "Linear" ? rest.far : "10");
        $fogDensity.val(fogType == "Exponential" ? rest.density : "0.025");

        $fogSelector.trigger("syncSelectTagHelper");
    });

    window.ThreeDModelEditor.on("historyChange", () =>
        $sceneTab.trigger("sync")
    );
});
