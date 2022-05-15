jQuery(document).ready(function ($) {
    const $form = $("form#post");
    const $projectTabPanel = $("#project-tab-panel");
    const $titleDiv = $("#titlediv");

    $("#submitpost").appendTo(
        $projectTabPanel.find(".Panel:nth-child(3) .Panel-row")
    );
    $("#editor").appendTo($form);
    $form.attr("novalidate", "true");

    $titleDiv.appendTo(
        $projectTabPanel.find(".Panel:nth-child(1) .Panel-row:nth-child(2)")
    );
    $titleDiv.find("#titlewrap").remove();

    $("#edit-slug-box").css("padding", "0");
    $("#save-post").hover(
        function () {
            $(this).css({
                background: "#f0f0f1",
                borderColor: "#0a4b78",
                color: "#0a4b78",
            });
        },
        function () {
            $(this).css({
                background: "rgb(246, 247, 247)",
                borderColor: "rgb(34, 113, 177)",
                color: "rgb(34, 113, 177)",
            });
        }
    );

    if (
        !$("#edit-slug-box")
            .text()
            .replace(/[\n\t]+/g, "")
    ) {
        $projectTabPanel
            .find(".Panel:nth-child(1) .Panel-row:nth-child(2)")
            .remove();
    }

    $("#samplepermalinknonce").appendTo(
        $projectTabPanel.find(".Panel:nth-child(1) .Panel-row:nth-child(2)")
    );
    $("#poststuff").remove();
    $("#submitpost").css("flex", "100%");
    $("#publish").css({
        padding: "0 10px",
        color: "#fff",
    });
    $("#save-post").css({
        padding: "0 10px",
        color: "#2271b1",
        borderColor: "#2271b1",
        background: "#f6f7f7",
    });
    $(".notice, #lost-connection-notice").css({
        position: "absolute",
        zIndex: "100",
    });
    $("#wpfooter").hide();

    window.ThreeDModelEditor.history.clear();
});
