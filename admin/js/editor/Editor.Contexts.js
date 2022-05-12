Editor.Contexts = class {
    #editor;
    constructor(editor) {
        this.#editor = editor;
        this.current = null;
    }
    
    /** +
     * 
     * @param {String} ctxName 
     * @param {THREE.Scene?} ctxScene 
     */
    create(ctxName, ctxScene) {
        if (ctxName in this) return;

        if (!(ctxName in this.#editor._scenes))
            this.#editor._scenes[ctxName] = ctxScene ? ctxScene : new THREE.Scene();

        const scope = this;

        /* 
         * Cada cena criada já contém o seu fator de opacidade (determinado pelo 
         * usuário no último save).
         * Logo, nós temos que pegar esses fatores já definidos.
         * Se não foi definido (como no caso que a cena foi recém criada),
         * o padrão é 0,5.
         */
        
        let sceneOpacityFactor = scope.#editor._scenes[ctxName].userData.opacityFactor;
        sceneOpacityFactor = sceneOpacityFactor ? sceneOpacityFactor : 0.5;

        let sceneRenderOrder = Object.keys(scope.#editor._scenes).indexOf(ctxName);
        sceneRenderOrder = sceneRenderOrder < 0 ? Object.keys(scope.#editor._scenes).length : sceneRenderOrder;
        
        const sceneUuid = this.#editor._scenes[ctxName].uuid;
        
        if (!this.#editor._memory.has("contexts")) 
            this.#editor._memory.create("contexts");

        if (!this.#editor._memory.contexts.has(sceneUuid))
            this.#editor._memory.contexts.create(sceneUuid);

        // Salvando as opacidades padrões dos objetos.
        this.#editor._scenes[ctxName].children.forEach((object) => {
            if ("material" in object) {
                this.#editor._memory.contexts[sceneUuid].set({
                    [object.uuid]: object.material.opacity,
                });
            }
        });

        this[ctxName] = {
            name: ctxName,
            scene: scope.#editor._scenes[ctxName],
            opacityFactor: sceneOpacityFactor,
            renderOrder: sceneRenderOrder,
            
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
                
                if (!scope.#editor._memory["contexts"][this.scene.uuid].has("opacityFactor")) {
                    scope.#editor._memory["contexts"][this.scene.uuid].set({
                        opacityFactor: value
                    });
                }

                if (feedHistory) {
                    const oldValueCopy = scope.#editor._memory["contexts"][this.scene.uuid].opacityFactor;

                    scope.#editor.history.add({
                        description: `Set scene.opacityFactor = ${value}`,
                        undo: () => this.setOpacityFactor(oldValueCopy, false),
                        redo: () => this.setOpacityFactor(value, false),
                        always: () => scope.#editor.save(),
                    });

                    scope.#editor._memory["contexts"][this.scene.uuid].clear(["opacityFactor"]);
                }
            }, 

            /**
             * Seta o nome do contexto e da cena (diretamente no modelo - ThreeDModel).
             * @param {String} name - O nome novo do contexto. 
             */
            setContextName(name, feedHistory = true) {
                const newName = name;
                const oldName = this.name;

                scope[newName] = this;
                delete scope[oldName];

                scope.#editor._scenes[newName] = this.scene;
                delete scope.#editor._scenes[oldName];

                this.name = name;
                this.setRenderOrder(this.renderOrder);
                
                if (!scope.#editor._memory["contexts"][this.scene.uuid].has("name")) {
                    scope.#editor._memory["contexts"][this.scene.uuid].set({
                        name: oldName
                    });
                }

                if (feedHistory) {
                    const oldValueCopy = scope.#editor._memory["contexts"][this.scene.uuid].name;

                    scope.#editor.history.add({
                        description: `Set scene.name = ${newName}`,
                        undo: () => this.setContextName(oldValueCopy, false),
                        redo: () => this.setContextName(newName, false),
                        always: () => scope.#editor.save(),
                    });

                    scope.#editor._memory["contexts"][this.scene.uuid].clear(["name"]);
                }
            },
            
            /**
             * 
             * @param {Number} index 
             */
            setRenderOrder(index, feedHistory = true) {
                if (index >= scope.Editor.renderOrder && this.name !== "Editor") {
                    index = scope.Editor.renderOrder - 1;
                }
                
                const sceneNames = Object.keys(scope.#editor._scenes);
                
                const cutPos = index > sceneNames.indexOf(this.name) ? index + 1 : index;
    
                const part1 = sceneNames.slice(0, cutPos).filter(item => item !== this.name);
                const part2 = sceneNames.slice(cutPos).filter(item => item !== this.name);

                const reordered = [ ...part1, this.name, ...part2 ];
                
                const scenesCopy = {};
                
                reordered.forEach((key, i) => {
                    scenesCopy[key] = scope.#editor._scenes[key];
                    if (key in scope)
                        scope[key].renderOrder = i;
                });
                
                scope.#editor._scenes = scenesCopy;
                
                if (!scope.#editor._memory["contexts"][this.scene.uuid].has("renderOrder")) {
                    scope.#editor._memory["contexts"][this.scene.uuid].set({
                        renderOrder: index
                    });
                }

                if (feedHistory) {
                    const oldValueCopy = scope.#editor._memory["contexts"][this.scene.uuid].renderOrder;

                    scope.#editor.history.add({
                        description: `Set scene.renderOrder = ${index}`,
                        undo: () => this.setRenderOrder(oldValueCopy, false),
                        redo: () => this.setRenderOrder(index, false),
                        always: () => scope.#editor.save(),
                    });

                    scope.#editor._memory["contexts"][this.scene.uuid].clear(["renderOrder"]);
                }
            },
            
            select() {
                Object.entries(scope.#editor._scenes).forEach(([name, scene]) => {
                    scene.children.forEach((object) => {
                        if ("material" in object) {
                            object.material.transparent = true;
                                
                            /*
                             * Se algum contexto anterior já estava selecionado (scope.current),
                             * atualizaremos as opacidades des seus objetos, caso o usuário as 
                             * tenha modificado.
                             */
                            if (scope.current && name == scope.current.name) {
                                scope.#editor._memory.contexts[scene.uuid][
                                    object.uuid
                                ] = object.material.opacity;
                            }
 
                            if (scope.#editor._memory.contexts.has(scene.uuid)) {
                                object.material.opacity =
                                    scope.#editor._memory.contexts[scene.uuid][object.uuid];
                                    
                                if (name !== this.name)
                                    object.material.opacity *= this.opacityFactor;

                                if (object.material.opacity > 1)
                                    object.material.opacity = 1;

                                if (object.material.opacity < 0)
                                    object.material.opacity = 0;
                            }

                            object.material.needsUpdate = true;
                        } else if (
                            /light(?!helper)/i.test(object.constructor.name)
                        ) {
                            const helper = scope.#editor.viewport.getHelper(object);
                            if (helper)
                                helper.visible =
                                    scope.#editor.viewport.showHelpers &&
                                    name == this.name;
                        }
                    });
                });

                scope.current = this;
            },
            
            delete() {
                delete scope.#editor._scenes[this.name];
                delete scope[this.name];
                
                scope.Editor.setRenderOrder(Object.keys(scope.#editor._scenes).length - 1);
                
                Object.keys(scope.#editor._scenes).forEach((key, i) => {
                    if (i == 0) {
                        scope[key].select();
                    }
                });
            },
        };

        this.Editor.setRenderOrder(Object.keys(this.#editor._scenes).length, false);
        
        if (ctxName !== "Editor") this[ctxName].select();
    }
};