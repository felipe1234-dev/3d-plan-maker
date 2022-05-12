jQuery(document).ready(function ($) {
    const $editor = $("#editor");
    const $menubar = $("#menubar");
    const $deleteBtn = $("#delete-btn");
    const $undoBtn = $("#undo-btn");
    const $redoBtn = $("#redo-btn");
    const $clearBtn = $("#clear-btn");

    $("#toggle-fullscreen-btn").click(function () {
        const $button = $(this);
        const editor = $editor[0];
        const isFullscreen =
            (document.fullScreenElement &&
                document.fullScreenElement !== null) ||
            (!document.mozFullScreen && !document.webkitIsFullScreen);

        if (isFullscreen) {
            if (editor.requestFullScreen) {
                editor.requestFullScreen();
            } else if (editor.mozRequestFullScreen) {
                editor.mozRequestFullScreen();
            } else if (editor.webkitRequestFullScreen) {
                editor.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }

            $button.text("em tela pequena");

            editor.classList.add("is-fullscreen");
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }

            $button.text("em tela cheia");

            editor.classList.remove("is-fullscreen");
        }
    });

    $("#toggle-theme-btn").click(function () {
        const theme = $editor.attr("data-theme");
        const oldHtml = this.innerHTML;
        
        if (theme === "light") {
            this.innerHTML = oldHtml.replace("escuro", "claro");
            $editor.attr("data-theme", "dark");
        } else {
            this.innerHTML = oldHtml.replace("claro", "escuro");
            $editor.attr("data-theme", "light");
        }
    });
    
    $("#add-hotspot-btn").click(function () {
        window.ThreeDModelEditor.scene.add("HotSpot", {
            position: [0, 0.5, 0],
            material: { text: "H" },
            checkForCollision: true,
        });
    });

    $menubar.find("div[data-geometry]").click(function () {
        window.ThreeDModelEditor.scene.add("Geometry", {
            position: [0, 0.5, 0], // x, y, z
            geometry: {
                type: $(this).data("geometry"),
                args: [],
            },
            material: {
                type: "MeshPhysicalMaterial",
                params: {
                    color: 0x049ef4, // azul
                    side: THREE.DoubleSide,
                },
            },
            checkForCollision: true,
        });
    });

    $menubar.find("div[data-light]").click(function () {
        window.ThreeDModelEditor.scene.add("Light", {
            position: [0, 10, 0],
            type: $(this).data("light"),
            args: [],
            checkForCollision: true,
        });
    });

    $deleteBtn.click(function () {
        if (!$(this).hasClass("is-inactive")) {
            window.ThreeDModelEditor.selected.remove();
        }
    });

    $undoBtn.click(function () {
        if (!$(this).hasClass("is-inactive")) {
            window.ThreeDModelEditor.history.undo();
        }
    });

    $redoBtn.click(function () {
        if (!$(this).hasClass("is-inactive")) {
            window.ThreeDModelEditor.history.redo();
        }
    });

    $clearBtn.click(function () {
        if (!$(this).hasClass("is-inactive")) {
            window.ThreeDModelEditor.history.clear();
        }
    });

    $menubar.on("sync", function () {
        if (window.ThreeDModelEditor.history.undoIsDisabled()) {
            $undoBtn.removeClass("is-inactive");
        } else {
            $undoBtn.addClass("is-inactive");
        }

        if (window.ThreeDModelEditor.history.redoIsDisabled()) {
            $redoBtn.addClass("is-inactive");
        } else {
            $redoBtn.removeClass("is-inactive");
        }

        if (window.ThreeDModelEditor.history.clearIsDisabled()) {
            $clearBtn.addClass("is-inactive");
        } else {
            $clearBtn.removeClass("is-inactive");
        }
    });

    window.ThreeDModelEditor.on("historyChange", () =>
        $menubar.trigger("sync")
    );
    window.ThreeDModelEditor.on("select", () =>
        $deleteBtn.removeClass("is-inactive")
    );
    window.ThreeDModelEditor.on("unselect", () =>
        $deleteBtn.addClass("is-inactive")
    );
});
