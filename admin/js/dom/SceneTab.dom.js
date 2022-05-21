jQuery(document).ready(function ($) {
    const $sceneTabPanel = $("#scene-tab-panel");
    const $ctxSelector = $("#ctx-selector");
    const $deleteSceneBtn = $("#delete-scene-btn");
    const $addSceneBtn = $("#add-scene-btn");
    const $ctxName = $("#ctx-name");
    const $opacityFactor = $("#opacity-factor");
    const $renderOrder = $("#scene-render-order");

    $ctxSelector.change(function () {
        if (!(this.value in PlanMaker.editor.contexts)) return;
        PlanMaker.editor.contexts[this.value].select();
        $sceneTabPanel.trigger("sync");
    });

    $deleteSceneBtn.click(function () {
        PlanMaker.editor.contexts.current.delete();
    });

    $addSceneBtn.click(function () {
        PlanMaker.editor.contexts.create("Nova cena");
        if ("Nova cena" in PlanMaker.editor.contexts) {
            PlanMaker.editor.contexts["Nova cena"].select();
        }
    });

    $ctxName.change(function () {
        PlanMaker.editor.contexts.current.setContextName(this.value);
    });

    $opacityFactor.change(function () {
        PlanMaker.editor.contexts.current.setOpacityFactor(
            parseFloat(this.value)
        );
    });

    $renderOrder.change(function () {
        PlanMaker.editor.contexts.current.setRenderOrder(
            parseFloat(this.value)
        );
    });

    $sceneTabPanel.on("sync", function () {
        const sceneNames = Object.keys(PlanMaker.editor.model.scenes);

        $ctxSelector.html("");
        sceneNames.forEach((sceneName) => {
            const isSelected =
                sceneName == PlanMaker.editor.contexts.current.name
                    ? " selected"
                    : "";
            const isDisabled = sceneName == "Editor" ? " disabled" : "";

            $ctxSelector.append(`
                <option value="${sceneName}"${isSelected}${isDisabled}>
                    ${sceneName}
                </option>
            `);
        });

        $ctxSelector.val(
            PlanMaker.editor.contexts.current.name
        );
        $ctxName.val(
            PlanMaker.editor.contexts.current.name
        );
        $opacityFactor.val(
            PlanMaker.editor.contexts.current.opacityFactor
        );
        $renderOrder.val(
            PlanMaker.editor.contexts.current.renderOrder
        );
        $renderOrder.attr("max", sceneNames.length - 1);
    });

    PlanMaker.editor.on("historyChange", () =>
        $sceneTabPanel.trigger("sync")
    );
});
