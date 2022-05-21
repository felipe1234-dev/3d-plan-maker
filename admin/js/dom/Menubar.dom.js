jQuery(document).ready(function ($) {
    const $editor = $("#editor");
    const $menubar = $("#menubar");
    const $inputFile = $menubar.find('input[type="file"]');
    const $deleteBtn = $("#delete-btn");
    const $undoBtn = $("#undo-btn");
    const $redoBtn = $("#redo-btn");
    const $clearBtn = $("#clear-btn");
    
    
    $("#toggle-fullscreen-btn").click(function() {
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

    $("#toggle-theme-btn").click(function() {
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
    
    $("#add-hotspot-btn").click(function() {
        const material = new THREE.HotSpotMaterial({
            text: "H"
        });
        material.name  = "HotSpotMaterial";
        
        const element3D = new THREE.HotSpot(material);
        element3D.name  = "HotSpot";
        
        window.ThreeDModelEditor.scene.add(element3D, {
            position: [0, 0.5, 0],
            checkForCollision: true
        });
    });

    $inputFile.change(function(event) {
        const action = $(this).data("action");
        const file = event.target.files[0];
        
        switch (action) {
            case "import-scene":
                window.ThreeDModelEditor.fileManager.importScene(file);
                break;
        
            default:
                break;
        }
    });
    
    $("#import-scene-btn").click(function() {
        $inputFile.attr("data-action", "import-scene");
        $inputFile.click();
    });
    
    $menubar.find("div[data-geometry]").click(function() {
        const type      = $(this).data("geometry");
        const geometry  = new THREE[type]();
        geometry.name   = type;
        
        const material  = new THREE.MeshPhysicalMaterial({
            color: 0x049ef4, // azul
            side: THREE.DoubleSide,
        });
        material.name   = "MeshPhysicalMaterial";
        
        const element3D = new THREE.Mesh(geometry, material);
        element3D.name  = "Mesh";
        
        window.ThreeDModelEditor.scene.add(element3D, {
            position: [0, 0.5, 0], // x, y, z
            checkForCollision: true,
        });
    });

    $menubar.find("div[data-light]").click(function() {
        const type  = $(this).data("light");
        const light = new THREE[type]();
        light.name  = type;
        
        window.ThreeDModelEditor.scene.add(light, {
            position: [0, 10, 0],
            checkForCollision: true
        });
    });

    $deleteBtn.click(function() {
        if (!$(this).hasClass("is-inactive")) {
            window.ThreeDModelEditor.selected.remove();
        }
    });

    $undoBtn.click(function() {
        if (!$(this).hasClass("is-inactive")) {
            window.ThreeDModelEditor.history.undo();
        }
    });

    $redoBtn.click(function() {
        if (!$(this).hasClass("is-inactive")) {
            window.ThreeDModelEditor.history.redo();
        }
    });

    $clearBtn.click(function() {
        if (!$(this).hasClass("is-inactive")) {
            window.ThreeDModelEditor.history.clear();
        }
    });

    $menubar.on("sync", function() {
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