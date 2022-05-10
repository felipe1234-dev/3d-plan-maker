jQuery(document).ready(function ($) {
    const $history = $("#history");

    $history.on("sync", function () {
        const $history = $(this);
        $history.html("");

        const $removeAllBtn = $("<div>", { class: "Outliner-item" });
        $removeAllBtn.text("Apagar todas as mudanças");
        $removeAllBtn.click(() => window.ThreeDModelEditor.history.rewind(-1));

        $history.append($removeAllBtn[0]);

        window.ThreeDModelEditor.history.timeline.forEach(
            ({ description }, i) => {
                const $item = $("<div>", { class: "Outliner-item" });

                $item.text(description);
                $item.click(() => window.ThreeDModelEditor.history.rewind(i));

                if (i == window.ThreeDModelEditor.history.now) {
                    $item.addClass("Outliner-item--is-active");
                } else if (i > window.ThreeDModelEditor.history.now) {
                    $item.addClass("Outliner-item--is-inactive");
                }

                $history.append($item[0]);
            }
        );
    });

    window.ThreeDModelEditor.on("historyChange", () =>
        $history.trigger("sync")
    );
});
