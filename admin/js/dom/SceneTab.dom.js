jQuery(document).ready(function ($) {
    const $sceneTabPanel = $("#scene-tab-panel");
    const $ctxSelector = $("#ctx-selector");
    const $deleteSceneBtn = $("#delete-scene-btn");
    const $addSceneBtn = $("#add-scene-btn");
    const $ctxName = $("#ctx-name");
    const $opacityFactor = $("#opacity-factor");
    const $renderOrder = $("#scene-render-order");

    $ctxSelector.change(function () {
        if (!(this.value in window.ThreeDModelEditor.contexts)) return;
        window.ThreeDModelEditor.contexts[this.value].select();
        $sceneTabPanel.trigger("sync");
    });

    $deleteSceneBtn.click(function () {
        window.ThreeDModelEditor.contexts.current.delete();
    });

    $addSceneBtn.click(function () {
        window.ThreeDModelEditor.contexts.create("Nova cena");
    });

    $ctxName.change(function () {
        window.ThreeDModelEditor.contexts.current.setContextName(this.value);
    });

    $opacityFactor.change(function () {
        window.ThreeDModelEditor.contexts.current.setOpacityFactor(
            parseFloat(this.value)
        );
    });

    $renderOrder.change(function () {
        window.ThreeDModelEditor.contexts.current.setRenderOrder(
            parseFloat(this.value)
        );
    });

    $sceneTabPanel.on("sync", function () {
        const sceneNames = Object.keys(window.ThreeDModelEditor.model.scenes);

        $ctxSelector.html("");
        sceneNames.forEach((sceneName) => {
            const isSelected =
                sceneName == window.ThreeDModelEditor.contexts.current.name
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
            window.ThreeDModelEditor.contexts.current.name
        );
        $ctxName.val(
            window.ThreeDModelEditor.contexts.current.name
        );
        $opacityFactor.val(
            window.ThreeDModelEditor.contexts.current.opacityFactor
        );
        $renderOrder.val(
            window.ThreeDModelEditor.contexts.current.renderOrder
        );
        $renderOrder.attr("max", sceneNames.length - 1);
    });

    window.ThreeDModelEditor.on("historyChange", () =>
        $sceneTabPanel.trigger("sync")
    );
});
