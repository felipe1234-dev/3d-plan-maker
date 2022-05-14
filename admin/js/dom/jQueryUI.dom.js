jQuery(document).ready(function ($) {
    const $sidebar = $("#sidebar");
    const $tabs = $sidebar.find(".Tabs");
    
    $tabs
        .accordion({
            active: 0,
            header: "> li > a",
            collapsible: true,
            activate: function (event, ui) {
                $(ui.newHeader).parent("li").addClass("Tabs-tabItem--is-selected");
                $(ui.newPanel).show().css("height", "auto");
                
                $(ui.oldHeader).parent("li").removeClass("Tabs-tabItem--is-selected");
                $(ui.oldPanel).hide().css("height", "auto");
            }
        })
        .find("#project-tab")
            .show()
            .css("height", "auto")
        .sortable();

    // setando os tooltips
    $(document).tooltip({
        tooltipClass: "custom-tooltip-styling",
    });

    window.ThreeDModelEditor.on("select", () =>
        $tabs.find("#scene-tab-item").click()
    );
    window.ThreeDModelEditor.on("unselect", () =>
        $tabs.find("#project-tab-item").click()
    );
});
