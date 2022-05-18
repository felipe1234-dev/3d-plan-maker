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
                callback: () => window.ThreeDModelEditor.viewport.zoomIn(),
                delay: 70,
            },
        ]);
    });

    $("#zoom-out-btn").mousedown(function () {
        $(document).trigger("mousehold", [
            {
                elem: this,
                callback: () => window.ThreeDModelEditor.viewport.zoomOut(),
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

        window.ThreeDModelEditor.controls.set("transformMode", newMode, false);
    });

    ["x", "y", "z"].forEach((axis) => {
        $(`[data-stat="coord-${axis}"]`).on("input", function () {
            window.ThreeDModelEditor.model.camera.position[axis] = this.value;
        });
    });

    $stats.on("sync", function () {
        $statFields.each(function () {
            const $field = $(this);
            const stat = $field.data("stat");
            const value = /coord/i.test(stat)
                ? window.ThreeDModelEditor.stats.position[
                        stat.replace(/coord-/i, "")
                  ]
                : window.ThreeDModelEditor.stats[stat];

            if (!/coord/i.test(stat)) {
                $field.text(value);
            } else {
                $field.val(value.toFixed(3));
            }
        });
    });

    window.ThreeDModelEditor.on("statUpdate", () => $stats.trigger("sync"));
});
