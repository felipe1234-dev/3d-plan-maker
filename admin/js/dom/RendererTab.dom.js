jQuery(document).ready(function ($) {
    const $rendererTabPanel = $("#project-tab-panel");
    const $antialias = $("#antialias-toggler");
    const $physicalLights = $("#physical-lights-toggler");
    const $shadowEnabler = $("#shadow-toggler");
    const $shadowType = $("#shadow-type-selector");
    const $toneType = $("#tone-mapping-selector");
    const $toneExposure = $("#tone-mapping-exposure");

    $antialias.change(function () {
        PlanMaker.editor.renderer.set("antialias", this.checked);
    });

    $physicalLights.change(function () {
        PlanMaker.editor.renderer.set(
            "enablePhysicalLights",
            this.checked
        );
    });

    $shadowEnabler.change(function () {
        PlanMaker.editor.renderer.set("enableShadows", this.checked);
    });

    $shadowType.change(function () {
        PlanMaker.editor.renderer.set(
            "shadowType",
            parseInt(this.value)
        );
    });

    $toneType.change(function () {
        PlanMaker.editor.renderer.set(
            "toneMapping",
            parseInt(this.value)
        );
    });

    $toneExposure.on("change input", function (event) {
        PlanMaker.editor.renderer.set(
            "toneMappingExposure",
            parseFloat(this.value),
            event.type == "change"
        );
    });

    $rendererTabPanel
        .on("sync", function () {
            $antialias[0].checked =
                PlanMaker.editor.renderer.get("antialias");
            $physicalLights[0].checked = 
                PlanMaker.editor.renderer.get("enablePhysicalLights");
            $shadowEnabler[0].checked =
                PlanMaker.editor.renderer.get("enableShadows");

            $shadowType.val(
                PlanMaker.editor.renderer.get("shadowType")
            );
            $toneType.val(
                PlanMaker.editor.renderer.get("toneMapping")
            );
            $toneExposure.val(
                PlanMaker.editor.renderer.get("toneMappingExposure")
            );
        })
        .trigger("sync");

    PlanMaker.editor.on("historyChange", () =>
        $rendererTabPanel.trigger("sync")
    );
});
