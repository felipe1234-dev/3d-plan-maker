jQuery(document).ready(function ($) {
    const $settingsTabPanel = $("#settings-tab-panel");
    const $toggleGrids = $("#toggle-grids-input");
    const $showHelpers = $("#show-helpers-input");
    const $gridSize = $("#grid-size-input");
    const $zoomSpeed = $("#zoom-speed-input");

    $toggleGrids
        .change(function () {
            PlanMaker.editor.viewport.set("showGrids", this.checked);
        })
        .change();

    $showHelpers
        .change(function () {
            PlanMaker.editor.viewport.set("showHelpers", this.checked);
        })
        .change();

    $gridSize
        .on("change input", function (event) {
            PlanMaker.editor.viewport.set(
                "gridSize",
                parseFloat(this.value),
                event.type == "change"
            );
        })
        .change();

    $zoomSpeed
        .on("change input", function (event) {
            PlanMaker.editor.controls.set(
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

    $settingsTabPanel.on("sync", function () {
        $toggleGrids[0].checked =
            PlanMaker.editor.viewport.get("showGrids");
        $showHelpers[0].checked =
            PlanMaker.editor.viewport.get("showHelpers");
        $gridSize.val(PlanMaker.editor.viewport.get("gridSize"));
        $zoomSpeed.val(PlanMaker.editor.controls.get("zoomSpeed"));
    });

    PlanMaker.editor.on("historyChange", () =>
        $settingsTabPanel.trigger("sync")
    );
});
