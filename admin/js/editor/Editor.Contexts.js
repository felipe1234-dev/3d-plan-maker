class Context {
    #editor;
    #parent;

    constructor(ctxName, opacityFactor, renderOrder, editor, parent) {
        this.#editor = editor;
        this.#parent = parent;
        this.name = ctxName;
        this.scene = editor._scenes[ctxName];
        this.opacityFactor = opacityFactor;
        this.renderOrder = renderOrder;
        
        const methods = [
            "setOpacityFactor",
            "setContextName",
            "setRenderOrder"
        ];
        
        methods.forEach((method) => {
            this[method] = new Proxy(this[method], {
                apply: function(func, scope, args) {
                    const feedHistory = args[1] === undefined ? true : args[1];
                    /* Se estiver undefined, significa que o usuário não passou o argumento, 
                    * logo, o valor padrão (true) é que vale.
                    */
                    let option;
                    let newVal;
                    let oldVal;
                
                    if (feedHistory) {
                        option = method
                            .replace("set", "")
                            .replace(/^([A-Z])/, (char) => (
                                char.toLowerCase()
                            ));
                        newVal = args[0];
                        oldVal = scope[option];
                    }
                    
                    if (typeof newVal === "string" && !newVal) {
                        return;
                    }
                    
                    func.call(scope, ...args);
                    
                    if (feedHistory) {
                        editor.history.add({
                            description: `${scope.name}: ${option} = ${
                                typeof newVal === "object"
                                    ? JSON.stringify(newVal)
                                    : newVal
                            }`,
                            undo: () => func.call(scope, oldVal, false),
                            redo: () => func.call(scope, newVal, false),
                            always: () => editor.save()
                        });
                    }
                }
            });
        });
    }
    
    /**
     * Modifica o valor do fator de opacidade. O fator de opacidade é um valor
     * pelo qual as opacidades dos objetos das outras cenas serão multiplicadas
     * para criar um efeito de transparência e assim dar destaque para as coisas
     * contidas neste contexto.
     * @param {Number} value - O novo valor do fator de opacidade (entre 0 e 1).
     */
    setOpacityFactor(value, feedHistory = true) {
        if (value > 1) value = 1;

        if (value < 0) value = 0;

        this.opacityFactor = value;
        this.scene.userData.opacityFactor = value;

        this.select();
    }

    /**
     * Seta o nome do contexto e da cena (diretamente no modelo - ThreeDModel).
     * @param {String} name - O nome novo do contexto.
     */
    setContextName(name, feedHistory = true) {
        if (name === "" || !name) {
            return;
        }
        
        const newName = name;
        const oldName = this.name;

        this.#parent[newName] = this;
        delete this.#parent[oldName];

        this.#editor._scenes[newName] = this.scene;
        delete this.#editor._scenes[oldName];

        this.name = newName;
        this.setRenderOrder(this.renderOrder);
    }

    /**
     *
     * @param {Number} index
     */
    setRenderOrder(index, feedHistory = true) {
        if (index >= this.#parent.Editor.renderOrder && this.name !== "Editor") {
            index = this.#parent.Editor.renderOrder - 1;
        }

        const sceneNames = Object.keys(this.#editor._scenes);

        const cutPos =
            index > sceneNames.indexOf(this.name) ? index + 1 : index;

        const part1 = sceneNames
            .slice(0, cutPos)
            .filter((item) => item !== this.name);
        const part2 = sceneNames
            .slice(cutPos)
            .filter((item) => item !== this.name);

        const reordered = [...part1, this.name, ...part2];

        const scenesCopy = {};

        reordered.forEach((key, i) => {
            scenesCopy[key] = this.#editor._scenes[key];
            if (key in this.#parent) this.#parent[key].renderOrder = i;
        });

        this.#editor._scenes = scenesCopy;
    }

    select() {
        if (this.#parent.current) {
            this.#parent.current.scene.children.forEach((object) => {
                const isGeom  = !/helper/i.test(object.constructor.name) && "material" in object;
                
                if (isGeom) {
                    object.material.transparent = true;
                    
                    /* Se algum contexto anterior já estava selecionado (this.#parent.current),
                    * atualizaremos as opacidades de seus objetos, caso o usuário as
                    * tenha modificado.
                    */
                    localStorage.setItem(object.uuid, object.material.opacity);
                }
            });
        }
        
        Object.entries(this.#editor._scenes).forEach(([sceneName, scene]) => {
            scene.children.forEach((object) => {
                const isLight = /light(?!helper)/i.test(object.constructor.name);
                const isGeom  = !/helper/i.test(object.constructor.name) && "material" in object;
                
                if (isLight) {
                    const helper = this.#editor.viewport.getHelper(object);
                    
                    if (!helper) {
                        return;
                    }
                    
                    if (sceneName !== this.name) {
                        helper.visible = false;
                    } else {
                        helper.visible = this.#editor.viewport.showHelpers
                    }
                } else if (isGeom) {
                    object.material.transparent = true;
                    
                    const previousOpacity = localStorage.getItem(object.uuid);
                    object.material.opacity = 
                        previousOpacity 
                            ? parseFloat(previousOpacity) 
                            : object.material.opacity;

                    if (sceneName !== this.name)
                        object.material.opacity *= this.opacityFactor;

                    if (object.material.opacity > 1)
                        object.material.opacity = 1;

                    if (object.material.opacity < 0)
                        object.material.opacity = 0;

                    object.material.needsUpdate = true;
                }
            });
        });

        this.#parent.current = this;
    }

    delete(feedHistory = true) {
        delete this.#editor._scenes[this.name];
        delete this.#parent[this.name];

        this.#parent.Editor.setRenderOrder(
            Object.keys(this.#editor._scenes).length - 1
        );

        Object.keys(this.#editor._scenes).forEach((key, i) => {
            if (i == 0) {
                this.#parent[key].select();
            }
        });
    }
}

class EditorContexts {
    #editor;
    constructor(editor) {
        this.#editor = editor;
        this.current = null;
        
        this.create = new Proxy(this.create, {
            apply: function(create, scope, args) {
                const feedHistory = args[1] === undefined ? true : args[1];
                /* Se estiver undefined, significa que o usuário não passou o argumento, 
                 * logo, o valor padrão (true) é que vale.
                 */
                let ctxName;
                let ctxScene;
            
                if (feedHistory) {
                    ctxName  = args[0];
                    ctxScene = args[2];
                }
                 
                create.call(scope, ...args);
                
                if (feedHistory) {
                    editor.history.add({
                        description: `Criou "${ctxName}"`,
                        undo: () => scope[ctxName].delete(false),
                        redo: () => create.call(scope, ctxName, false, ctxScene),
                        always: () => editor.save()
                    });
                }
            }
        });
    }
    
    /**
     * @param {string} ctxName 
     * @param {boolean?} feedHistory
     * @param {THREE.Scene?} ctxScene 
     * @returns {void}
     */
    create(ctxName, feedHistory = true, ctxScene) {
        if (ctxName in this) return;

        if (!(ctxName in this.#editor._scenes))
            this.#editor._scenes[ctxName] = ctxScene ? ctxScene : new THREE.Scene();

        /* Cada cena criada já contém o seu fator de opacidade (determinado pelo 
         * usuário no último save).
         * Logo, nós temos que pegar esses fatores já definidos.
         * Se não foi definido (como no caso que a cena foi recém criada),
         * o padrão é 0,5.
         */
        
        let sceneOpacityFactor = this.#editor._scenes[ctxName].userData.opacityFactor;
        sceneOpacityFactor = sceneOpacityFactor ? sceneOpacityFactor : 0.5;

        let sceneRenderOrder = Object.keys(this.#editor._scenes).indexOf(ctxName);
        sceneRenderOrder = 
            sceneRenderOrder < 0 
                ? Object.keys(this.#editor._scenes).length 
                : sceneRenderOrder;
    
        // Salvando as opacidades padrões dos objetos.
        this.#editor._scenes[ctxName].children.forEach((object) => {
            if (!/helper/i.test(object.constructor.name) && "material" in object) {
                localStorage.setItem(object.uuid, object.material.opacity);
            }
        });

        this[ctxName] = new Context(
            ctxName, 
            sceneOpacityFactor, 
            sceneRenderOrder, 
            this.#editor,
            this
        );

        this.Editor.setRenderOrder(
            Object.keys(this.#editor._scenes).length, 
            false
        );
    }
}