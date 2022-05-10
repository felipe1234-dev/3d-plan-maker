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
                window.ThreeDModelEditor.viewport.zoomIn();
                break;

            case event.ctrlKey && event.key == "-":
                event.preventDefault();
                window.ThreeDModelEditor.viewport.zoomOut();
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
                window.ThreeDModelEditor.controls.set(
                    "showX",
                    !window.ThreeDModelEditor.controls.get("showX")
                );
                break;

            case /^y$/i.test(key):
                window.ThreeDModelEditor.controls.set(
                    "showY",
                    !window.ThreeDModelEditor.controls.get("showY")
                );
                break;

            case /^z$/i.test(key):
                window.ThreeDModelEditor.controls.set(
                    "showZ",
                    !window.ThreeDModelEditor.controls.get("showZ")
                );
                break;

            default:
                break;
        }
    };

    window.ThreeDModelEditor.on("select", () =>
        $(window).on("keydown", transformShortcuts)
    );
    window.ThreeDModelEditor.on("unselect", () =>
        $(window).off("keydown", transformShortcuts)
    );
});
