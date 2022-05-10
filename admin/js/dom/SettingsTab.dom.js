jQuery(document).ready(function ($) {
    const $settingsTab = $("#settings-tab");
    const $toggleGrids = $("#toggle-grids-input");
    const $showHelpers = $("#show-helpers-input");
    const $gridSize = $("#grid-size-input");
    const $zoomSpeed = $("#zoom-speed-input");

    $toggleGrids
        .change(function () {
            window.ThreeDModelEditor.viewport.set("showGrids", this.checked);
        })
        .change();

    $showHelpers
        .change(function () {
            window.ThreeDModelEditor.viewport.set("showHelpers", this.checked);
        })
        .change();

    $gridSize
        .on("change input", function (event) {
            window.ThreeDModelEditor.viewport.set(
                "gridSize",
                parseFloat(this.value),
                event.type == "change"
            );
        })
        .change();

    $zoomSpeed
        .on("change input", function (event) {
            window.ThreeDModelEditor.controls.set(
                "zoomSpeed",
                parseFloat(this.value),
                event.type == "change"
            );
        })
        .change();

    ["undo", "redo"].forEach((shortcut) => {
        const $inp = $(`#${shortcut}_shortcut`);
        const $btn = $(`#${shortcut}-btn`);

        $inp.change(function () {
            $btn.text($btn.text().replace(/\(.+\)/, `(Ctrl+${this.value})`));
        }).change();
    });

    ["translate", "rotate", "scale"].forEach((shortcut) => {
        const $inp = $(`#${shortcut}_shortcut`);
        const $btn = $(`[data-mode="${shortcut}"]`);

        $inp.change(function () {
            $btn.attr(
                "title",
                $btn.attr("title").replace(/\(.+\)/, `(${this.value})`)
            );
        }).change();
    });

    $settingsTab.on("sync", function () {
        $toggleGrids[0].checked =
            window.ThreeDModelEditor.viewport.get("showGrids");
        $showHelpers[0].checked =
            window.ThreeDModelEditor.viewport.get("showHelpers");
        $gridSize.val(window.ThreeDModelEditor.viewport.get("gridSize"));
        $zoomSpeed.val(window.ThreeDModelEditor.controls.get("zoomSpeed"));
    });

    window.ThreeDModelEditor.on("historyChange", () =>
        $settingsTab.trigger("sync")
    );
});
