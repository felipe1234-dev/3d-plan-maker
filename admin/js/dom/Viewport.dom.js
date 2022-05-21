jQuery(document).ready(function ($) {
    const $stats = $("#stats");
    const $statFields = $("[data-stat]");
    const $toolbar = $("#toolbar");

    $(document).on("mousehold", function (event, { elem, callback, delay }) {
        const $elem = $(elem);

        const mouseTimer = setInterval(() => {
            if ($elem.find(":hover").length < 1) {
                $elem.trigger("mouseup");
                return;
            }
            callback();
        }, delay);

        $elem.mouseup(() => {
            if (mouseTimer) clearInterval(mouseTimer);
        });
    });

    $("#zoom-in-btn").mousedown(function () {
        $(document).trigger("mousehold", [
            {
                elem: this,
                callback: () => PlanMaker.editor.viewport.zoomIn(),
                delay: 70,
            },
        ]);
    });

    $("#zoom-out-btn").mousedown(function () {
        $(document).trigger("mousehold", [
            {
                elem: this,
                callback: () => PlanMaker.editor.viewport.zoomOut(),
                delay: 70,
            },
        ]);
    });

    $toolbar.find("div.Viewport-toolbar-button[data-mode]").click(function () {
        const newMode = $(this).data("mode");

        $toolbar
            .find("div.Viewport-toolbar-button[data-mode]")
            .removeClass("Viewport-toolbar-button--is-selected");
        $(this).addClass("Viewport-toolbar-button--is-selected");

        PlanMaker.editor.controls.set("transformMode", newMode, false);
    });

    ["x", "y", "z"].forEach((axis) => {
        $(`[data-stat="coord-${axis}"]`).on("input", function () {
            PlanMaker.editor.model.camera.position[axis] = this.value;
        });
    });

    $stats.on("sync", function () {
        $statFields.each(function () {
            const $field = $(this);
            const stat = $field.data("stat");
            const value = /coord/i.test(stat)
                ? PlanMaker.editor.stats.position[
                        stat.replace(/coord-/i, "")
                  ]
                : PlanMaker.editor.stats[stat];

            if (!/coord/i.test(stat)) {
                $field.text(value);
            } else {
                $field.val(value.toFixed(3));
            }
        });
    });

    PlanMaker.editor.on("statUpdate", () => $stats.trigger("sync"));
});
