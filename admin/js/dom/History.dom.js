jQuery(document).ready(function ($) {
    const $history = $("#history");

    $history.on("sync", function () {
        const $history = $(this);
        $history.html("");

        const $removeAllBtn = $("<div>", { class: "Outliner-item" });
        $removeAllBtn.text("Apagar todas as mudanças");
        $removeAllBtn.click(() => PlanMaker.editor.history.rewind(-1));

        $history.append($removeAllBtn[0]);

        PlanMaker.editor.history.timeline.forEach(
            ({ description }, i) => {
                const $item = $("<div>", { class: "Outliner-item" });

                $item.text(description);
                $item.click(() => PlanMaker.editor.history.rewind(i));

                if (i == PlanMaker.editor.history.now) {
                    $item.addClass("Outliner-item--is-active");
                } else if (i > PlanMaker.editor.history.now) {
                    $item.addClass("Outliner-item--is-inactive");
                }

                $history.append($item[0]);
            }
        );
    });

    PlanMaker.editor.on("historyChange", () =>
        $history.trigger("sync")
    );
});
