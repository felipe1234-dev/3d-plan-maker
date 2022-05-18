class EditorViewport {
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
        
        this.set = new Proxy(this.set, {
            apply: function(set, scope, args) {
                const feedHistory = args[2] === undefined ? true : args[2];
                /* Se estiver undefined, significa que o usuário não passou o argumento, 
                 * logo, o valor padrão (true) é que vale.
                 */
                let option;
                let newVal;
                let oldVal;
            
                if (feedHistory) {
                    option  = args[0];
                    newVal  = args[1];
                    oldVal  = scope.get(option);
                }
                 
                set.call(scope, ...args);
                
                if (feedHistory) {
                    editor.history.add({
                        description: `viewport: ${option} = ${
                            typeof newVal === "object"
                                ? JSON.stringify(newVal)
                                : newVal
                        }`,
                        undo: () => set.call(scope, option, oldVal, false),
                        redo: () => set.call(scope, option, newVal, false),
                        always: () => editor.save()
                    });
                }
            }
        });
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
    
    setHelper(element3D) {
        const isGroup   = element3D instanceof THREE.Group;
        const isMesh    = element3D instanceof THREE.Mesh;
        const isHotSpot = element3D instanceof THREE.HotSpot; 
        const isLight   = /light/i.test(element3D.constructor.name);
            
        let helper;
        
        if (isGroup) { 
        } else if (isMesh || isHotSpot) {
            helper = new THREE.BoxHelper(element3D, new THREE.Color(0xffff00));
            helper.visible = false;
        } else if (isLight) { 
            // AmbientLight não tem um helper
            if (element3D.type !== "AmbientLight") {
                helper = new THREE[element3D.type + "Helper"](element3D);
                helper.visible = this.showHelpers; 
            }
        }
            
        if (helper) {
            this.helpers[element3D.uuid] = helper;
        }
    }
    
    getHelper(element3D) {
        return this.helpers[element3D.uuid]
    }
    
    removeHelper(element3D) {
        const helper = this.getHelper(element3D);
        this.#editor._currentScene.remove(element3D);
        this.#editor._currentScene.remove(helper);

        delete this.helpers[element3D.uuid];
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
    }
    
    /* Os métodos zoomIn e zoomOut foram implementados no próprio código fonte
     * da biblioteca threejs: libs/threejs-r136/assets/controls/OrbitControls.js, 
     * linhas 1049 e 1050.
     */

    zoomIn = () => this.#editor.model.orbitControls.zoomIn()

    zoomOut = () => this.#editor.model.orbitControls.zoomOut()
}