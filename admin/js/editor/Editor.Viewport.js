Editor.Viewport = class {
    #editor;
    #grids;
    #helpers;

    constructor(editor) {
        this.#editor = editor;
        
        this.#grids = {
            show: true,
            group: null,
            children: [
                {
                    size: 30, 
                    divisions: 30,
                    color: 0x888888,
                    object: null
                },
                {
                    size: 30,
                    divisions: 6,
                    color: 0x222222,
                    object: null
                }
            ]
        }

        this.#helpers = {
            show: true,
            list: {}
        }
        
        this.#addGrids();
    }
    
    get showGrids() {
        return this.#grids.show;
    }

    set showGrids(value) {
        this.#grids.group.visible = value;
        this.#grids.show = value;
    }

    get gridSize() {
        return this.#grids.children[0].size;
    }

    set gridSize(value) {
        this.#editor.model.scenes.Editor.remove(this.#grids.group);

        this.#grids.children[0].size = value;
        this.#grids.children[0].divisions = value;

        this.#grids.children[1].size = value;
        this.#grids.children[1].divisions = value / 5;

        this.#addGrids();
    }

    get helpers() {
        return this.#helpers.list;
    }

    get showHelpers() {
        return this.#helpers.show;
    }

    set showHelpers(value) {
        this.#helpers.show = value;

        Object.keys(this.helpers).forEach(uuid => {
            if ("light" in this.helpers[uuid])
                this.helpers[uuid].visible = value;
        });

        if (!!this.#editor._selected)
            this.getHelper(this.#editor._selected).visible = value;
    }
  
    #addGrids() {
        this.#grids.group = new THREE.Group();
    
        this.#grids.children.forEach(({ size, divisions, color }, i) => {
            const childGrid = new THREE.GridHelper(size, divisions);
            
            childGrid.material.color.setHex(color);
            childGrid.material.vertexColors = false;

            this.#grids.group.add(childGrid);
            this.#grids.children[i].object = childGrid;
        });

        this.#editor.model.scenes.Editor.add(this.#grids.group);
    }
    
    setHelper(object) {
        const isGroup = object instanceof THREE.Group;
        const isMesh = object instanceof THREE.Mesh;
        const isHotSpot = object instanceof THREE.HotSpot; 
        const isLight = /light/i.test(object.constructor.name);
            
        let helper;
        
        if (isGroup) {   
        } else if (isMesh || isHotSpot) {
            helper = new THREE.BoxHelper(object, new THREE.Color(0xffff00));
            helper.visible = false;
        } else if (isLight) { 
            // ambient light não tem um helper
            if (object.type !== "AmbientLight") {
                helper = new THREE[object.type + "Helper"](object);
                helper.visible = this.showHelpers; 
            }
        }
            
        if (helper)
            this.helpers[object.uuid] = helper;
    }
    
    getHelper(object) {
        return this.helpers[object.uuid]
    }
    
    get(option) {
        if (!(option in this)) {
            if (/show[\s-]*Grids/i.test(option)) {
                return this.showGrids;
            }

            if (/show[\s-]*Helpers/i.test(option)) {
                return this.showHelpers;
            }

            if (/grid[\s-]*Size/i.test(option)) {
                return this.gridSize;
            }

            // o usuário/programador pode enviar um "caminho" de objeto 
            // em pontos: "prop1.prop2.prop3..."
            if (/(\w+\.)+/.test(option)) {
                return eval(`this.${option}`);
            }
        } else {
            option = option.replace(/[\s-]+([A-Z])/g, "$1");
            return this[option];
        }
    }

    set(option, value, feedHistory = true) {
        if (!this.#editor._memory.has("viewport"))
            this.#editor._memory.create("viewport");

        if (!this.#editor._memory["viewport"].has(option)) {
            this.#editor._memory["viewport"].set({
                [option]: this.get(option)
            });
        }

        if (/show[\s-]*Grids/i.test(option)) {
            this.showGrids = value;
        } else if (/show[\s-]*Helpers/i.test(option)) {
            this.showHelpers = value;
        } else if (/grid[\s-]*Size/i.test(option)) {
            this.gridSize = value;
        } else if (/(\w+\.)+/.test(option)) {
            // o usuário/programador pode enviar um "caminho" de objeto 
            // em pontos: "prop1.prop2.prop3..."
            eval(`this.${option} = value`);
        } else {
            this[option] = value;
        }

        if (feedHistory) {
            const oldValueCopy = this.#editor._memory["viewport"][option];

            this.#editor.history.add({
                description: `Set viewport.${option} = ${typeof value == "object" ? JSON.stringify(value) : value}`,
                undo: () => this.set(option, oldValueCopy, false),
                redo: () => this.set(option, value, false)
            });

            this.#editor._memory.clear(["viewport"]);
        }
    }
    
    /** 
     * os métodos zoomIn e zoomOut foram implementados no próprio código fonte
     * da biblioteca threejs: libs/threejs-r136/assets/controls/OrbitControls.js, 
     * linhas 1049 e 1050
     */

    zoomIn = () => this.#editor.model.orbitControls.zoomIn()

    zoomOut = () => this.#editor.model.orbitControls.zoomOut()
}