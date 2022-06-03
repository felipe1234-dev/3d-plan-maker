jQuery(document).ready(function ($) {
    const $editor = $("#editor");
    const $menubar = $("#menubar");

    const $fullscreenBtn = $("#toggle-fullscreen-btn");
    const $themeBtn = $("#toggle-theme-btn");
    const $addHotSpotBtn = $("#add-hotspot-btn");

    const $inputFile = $menubar.find('input[type="file"]');
    const $importBtn = $("#import-btn");
    
    const $deleteBtn = $("#delete-btn");
    
    const $undoBtn = $("#undo-btn");
    const $redoBtn = $("#redo-btn");
    const $clearBtn = $("#clear-btn");
    
    
    $fullscreenBtn.click(function() {
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

            $button.text("em tela pequena (Esc)");

            editor.classList.add("is-fullscreen");
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }

            $button.text("em tela cheia (Ctrl+f)");

            editor.classList.remove("is-fullscreen");
        }
    });

    $themeBtn.click(function() {
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
    
    $addHotSpotBtn.click(function() {
        const material = new THREE.HotSpotMaterial({
            text: "H"
        });
        material.name  = "HotSpotMaterial";
        
        const element3D = new THREE.HotSpot(material);
        element3D.name  = "HotSpot";
        
        PlanMaker.editor.scene.add(element3D, {
            position: [0, 0.5, 0],
            checkForCollision: true
        });
    });

    $inputFile.change(function(event) {
        const files  = event.target.files;
        let model    = null;
        const data   = new FormData();
        
        data.append("action", `${PlanMaker.postType}_file_upload`);
          
        [ ...files ]
            .filter((file) => {
                if (/image\//.test(file.type)) {
                    return true;
                } else {
                    model = file;
                    return false;
                }
            })
            .forEach((file, index) => (
      		    data.append(`${PlanMaker.postType}_file_upload_${index}`, file)
            ));
            
        if (!model) {
            alert("Você precisa selecionar um modelo!");
            return;
        }

    	$.ajax({
    		url: PlanMaker.ajaxURL,
	        type: "POST",
	        data: data,
	        cache: false,
	        dataType: "json",
	        processData: false, // Don't process the files
	        contentType: false, // Set content type to false as jQuery will tell the server its a query string request
	        success: (resp) => {
                resp = resp.filter((file) => file.status === "ERROR");
                
                if (resp.length > 0) {
                    resp.forEach((file) => alert(file.message));
                    return;
                }
    
                alert(
                    "Atenção: O sistema tentará colocar os mapas no lugar, porém, não é um " +
                    "algoritmo perfeito e pode falhar. Não criemos pânico! Tente selecionar o " +
                    "item, ir em \"Elemento 3D\" > \"Material\" e enviar os mapas você mesmo(a)! :)"
                );           
                
                PlanMaker.editor.fileManager.import(
                    model, 
                    `${PlanMaker.upload.baseurl}/${PlanMaker.postType}/`
                );
	        }
	    });
    });
    
    $importBtn.click(function() {
        $inputFile.val("");
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
        
        PlanMaker.editor.scene.add(element3D, {
            position: [0, 0.5, 0], // x, y, z
            checkForCollision: true,
        });
    });

    $menubar.find("div[data-light]").click(function() {
        const type  = $(this).data("light");
        const light = new THREE[type]();
        light.name  = type;
        
        PlanMaker.editor.scene.add(light, {
            position: [0, 10, 0],
            checkForCollision: true
        });
    });

    $deleteBtn.click(function() {
        if (!$(this).hasClass("is-inactive")) {
            PlanMaker.editor.selected.remove();
        }
    });

    $undoBtn.click(function() {
        if (!$(this).hasClass("is-inactive")) {
            PlanMaker.editor.history.undo();
        }
    });

    $redoBtn.click(function() {
        if (!$(this).hasClass("is-inactive")) {
            PlanMaker.editor.history.redo();
        }
    });

    $clearBtn.click(function() {
        if (!$(this).hasClass("is-inactive")) {
            PlanMaker.editor.history.clear();
        }
    });

    $menubar.on("sync", function() {
        if (PlanMaker.editor.history.undoIsDisabled()) {
            $undoBtn.removeClass("is-inactive");
        } else {
            $undoBtn.addClass("is-inactive");
        }

        if (PlanMaker.editor.history.redoIsDisabled()) {
            $redoBtn.addClass("is-inactive");
        } else {
            $redoBtn.removeClass("is-inactive");
        }

        if (PlanMaker.editor.history.clearIsDisabled()) {
            $clearBtn.addClass("is-inactive");
        } else {
            $clearBtn.removeClass("is-inactive");
        }
    });

    PlanMaker.editor.on("historyChange", () =>
        $menubar.trigger("sync")
    );
    PlanMaker.editor.on("select", () =>
        $deleteBtn.removeClass("is-inactive")
    );
    PlanMaker.editor.on("unselect", () =>
        $deleteBtn.addClass("is-inactive")
    );
});