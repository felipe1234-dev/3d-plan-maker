jQuery(document).ready(function ($) {
    const $tabs = $(".Tabs");
    const $sidebar = $("#sidebar");
    
    const $sidebarTabs = $sidebar.find(".Tabs");
    const $projectTabItem = $sidebarTabs.find("#project-tab-item");
    const $elementTabItem = $sidebarTabs.find("#3d-elem-tab-item");
    
    $tabs
        .accordion({
            header: "> li > a",
            collapsible: true,
            activate: function (event, ui) {
                $(ui.newHeader).parent("li").addClass("Tabs-tabItem--is-selected");
                $(ui.newPanel).show().css("height", "auto");
                
                $(ui.oldHeader).parent("li").removeClass("Tabs-tabItem--is-selected");
                $(ui.oldPanel).hide().css("height", "auto");
            }
        })
        .sortable()
        .find(".Tabs-tabPanel")
        .css("height", "auto");
    
    $projectTabItem.click();

    // setando os tooltips
    $(document).tooltip({
        tooltipClass: "custom-tooltip-styling",
    });

    PlanMaker.editor.on("select", () => {
        const isSelected = $elementTabItem.attr("aria-selected") === "true";
        if (isSelected) {
            return;
        }
        
        $elementTabItem.click();
    });
    PlanMaker.editor.on("unselect", () => {
        $projectTabItem.click();
        
        const isSelected = $projectTabItem.attr("aria-selected") === "true";
        if (isSelected) {
            $projectTabItem.click();
        }
    });
});
