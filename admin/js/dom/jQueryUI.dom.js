jQuery(document).ready(function ($) {
    const PROJECT_TAB = 0;
    const SCENE_TAB = 1;
    const SETTINGS_TAB = 2;

    const OBJECT_TAB = 0;
    const GEOMETRY_TAB = 1;
    const MATERIAL_TAB = 2;

    const $sidebar = $("#sidebar");

    // setando OS tooltips
    $(document).tooltip({
        tooltipClass: "custom-tooltip-styling",
    });

    // setando tabs
    $sidebar.tabs({
        active: PROJECT_TAB,
        activate: function (event, { newTab, oldTab }) {
            $(newTab).addClass("Tabs-tabItem--is-selected");
            $(oldTab).removeClass("Tabs-tabItem--is-selected");
        },
    });

    $("#properties").tabs({
        active: OBJECT_TAB,
        activate: function (event, { newTab, oldTab }) {
            $(newTab).addClass("Tabs-tabItem--is-selected");
            $(oldTab).removeClass("Tabs-tabItem--is-selected");
        },
    });

    window.ThreeDModelEditor.on("select", () =>
        $sidebar.tabs({ active: SCENE_TAB })
    );
    window.ThreeDModelEditor.on("unselect", () =>
        $sidebar.tabs({ active: PROJECT_TAB })
    );
});
