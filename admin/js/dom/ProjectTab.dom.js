jQuery(document).ready(function ($) {
    const $projectTab = $("#project-tab");
    const $antialias = $("#antialias-toggler");
    const $physicalLights = $("#physical-lights-toggler");
    const $shadowEnabler = $("#shadow-toggler");
    const $shadowType = $("#shadow-type-selector");
    const $toneType = $("#tone-mapping-selector");
    const $toneExposure = $("#tone-mapping-exposure");

    $antialias.change(function () {
        window.ThreeDModelEditor.renderer.set("antialias", this.checked);
    });

    $physicalLights.change(function () {
        window.ThreeDModelEditor.renderer.set(
            "enablePhysicalLights",
            this.checked
        );
    });

    $shadowEnabler.change(function () {
        window.ThreeDModelEditor.renderer.set("enableShadows", this.checked);
    });

    $shadowType.change(function () {
        window.ThreeDModelEditor.renderer.set(
            "shadowType",
            parseInt(this.value)
        );
    });

    $toneType.change(function () {
        window.ThreeDModelEditor.renderer.set(
            "toneMapping",
            parseInt(this.value)
        );
    });

    $toneExposure.on("change input", function (event) {
        window.ThreeDModelEditor.renderer.set(
            "toneMappingExposure",
            parseFloat(this.value),
            event.type == "change"
        );
    });

    $projectTab
        .on("sync", function () {
            $antialias[0].checked =
                window.ThreeDModelEditor.renderer.get("antialias");
            $physicalLights[0].checked = window.ThreeDModelEditor.renderer.get(
                "enablePhysicalLights"
            );
            $shadowEnabler[0].checked =
                window.ThreeDModelEditor.renderer.get("enableShadows");

            $shadowType.val(
                window.ThreeDModelEditor.renderer.get("shadowType")
            );
            $toneType.val(window.ThreeDModelEditor.renderer.get("toneMapping"));
            $toneExposure.val(
                window.ThreeDModelEditor.renderer.get("toneMappingExposure")
            );
        })
        .trigger("sync");

    window.ThreeDModelEditor.on("historyChange", () =>
        $projectTab.trigger("sync")
    );
});
