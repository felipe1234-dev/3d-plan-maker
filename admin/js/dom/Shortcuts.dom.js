jQuery(document).ready(function ($) {
    $(window).on("keydown", function (event) {
        switch (true) {
            case event.ctrlKey && event.key == $("#undo_shortcut").val():
                $("#undo-btn").click();
                break;

            case event.ctrlKey && event.key == $("#redo_shortcut").val():
                $("#redo-btn").click();
                break;

            case event.key == "Escape":
                event.preventDefault();
                $("#toggle-fullscreen-btn").click();
                break;

            case event.ctrlKey && event.key == "=":
                event.preventDefault();
                PlanMaker.editor.viewport.zoomIn();
                break;

            case event.ctrlKey && event.key == "-":
                event.preventDefault();
                PlanMaker.editor.viewport.zoomOut();
                break;

            case event.key == "Delete":
                $("#delete-btn").click();
                break;

            default:
                break;
        }
    });

    const transformShortcuts = (event) => {
        const key = event.key;

        switch (true) {
            case $("#translate_shortcut").val() == key:
                $('[data-mode="translate"]').click();
                break;

            case $("#rotate_shortcut").val() == key:
                $('[data-mode="rotate"]').click();
                break;

            case $("#scale_shortcut").val() == key:
                $('[data-mode="scale"]').click();
                break;

            case /^x$/i.test(key):
                PlanMaker.editor.controls.set(
                    "showX",
                    !PlanMaker.editor.controls.get("showX")
                );
                break;

            case /^y$/i.test(key):
                PlanMaker.editor.controls.set(
                    "showY",
                    !PlanMaker.editor.controls.get("showY")
                );
                break;

            case /^z$/i.test(key):
                PlanMaker.editor.controls.set(
                    "showZ",
                    !PlanMaker.editor.controls.get("showZ")
                );
                break;

            default:
                break;
        }
    };

    PlanMaker.editor.on("select", () =>
        $(window).on("keydown", transformShortcuts)
    );
    PlanMaker.editor.on("unselect", () =>
        $(window).off("keydown", transformShortcuts)
    );
});
