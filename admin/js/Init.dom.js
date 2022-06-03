jQuery(document).ready(function ($) {
    // Segunda camada de proteção contra arquivos indesejáveis de outros plugins
	$("link[href], script[src]").each(function() {
		const url = $(this).attr(this.tagName === "LINK" ? "href" : "src");
		
		if (url.search("/wp-content/plugins/") > 0 && url.search(PlanMaker.postType) < 0) {
			$(this).remove();
		}
	});
    
    const $form = $("form#post");
    const $savePost = $("#save-post");
    const $projectTabPanel = $("#project-tab-panel");
    const $titleDiv = $("#titlediv");
    
    $("#submitpost").appendTo(
        $projectTabPanel.find(".Panel:nth-child(2) .Panel-row")
    );
    $("#editor").appendTo($form);
    $form.attr("novalidate", "true");

    $titleDiv.appendTo(
        $projectTabPanel.find(".Panel:nth-child(1) .Panel-row:nth-child(2)")
    );
    $titleDiv.find("#titlewrap").remove();

    $("#edit-slug-box").css("padding", "0");
    $savePost.hover(
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
    $savePost.css({
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

    PlanMaker.editor.history.clear();
    
    
    $savePost.click((event) => {
        event.preventDefault(); // Previne que o formulário seja submetido.
        
        $("#minor-publishing-actions").addClass("loading-content");
        
        $savePost
            .prop("disabled", true)
            .parent()
            .find(".spinner")
            .addClass("is-active")
            .css("margin", "4px 8px 0");
        
        PlanMaker.editor.save(); // Salva o modelo.
        
        $form.submit(); // Agora sim pode submeter.
    });
});