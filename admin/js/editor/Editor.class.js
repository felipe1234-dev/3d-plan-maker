/**
 * @typedef {Object} ThreeDModel
 * @typedef {Object} Object3D
 */

class Editor {
    /**
     * Construtor.
     * @param {ThreeDModel} model - O modelo da planta a ser editada, instância da classe ThreeDModel.
     */
    constructor(model) {
        /**
         * Usado para guardar dados temporários para operações no editor.
         * @protected 
         */
        this._memory = {
            /**
             * Cria um "namespace", contexto ou subpartição para os dados na memória.
             * @param {String} ctxName Nome do espaço.
             */
            create(ctxName) {
                this[ctxName] = {
                    create: this.create,
                    has: this.has,
                    set: this.set,
                    clear: this.clear,
                };
            },

            /**
             * Verifica se a memória contém subpartição.
             * @param   {String}  ctxName - Nome da subpartição.
             * @returns {Boolean} Retorna verdadeiro se tiver a subpartição.
             */
            has(ctxName) {
                return ctxName in this;
            },

            /**
             * Cria ou modifica dados na memória.
             * @param {Object<String, Any>} params - Objeto JS no formato: { "nomeDado": "valorDado", ... }.
             */
            set(params) {
                Object.entries(params).forEach(([key, value]) => {
                    this[key] = value;
                });
            },

            /**
             * Limpa/Exclui dados salvos na memória.
             * @param {Array<String>} keys - Lista com os nomes dos dados a serem excluídos.
             */
            clear(keys) {
                keys.forEach((key) => {
                    delete this[key];
                });
            },
        };

        /**
         * Lista de eventos possiveis do editor.
         * @protected 
         * @readonly
         */
        this._events = {
            onSelect: [],
            onUnselect: [],
            onEditSelected: [],
            onHistoryChange: [],
            onStatUpdate: [],
            onSaveModel: [],
            onSaveRenderer: [],
        };
        
        this.model     = model;
        this.raycaster = new THREE.Raycaster();
        this.mouse     = new THREE.Vector2();
        
        this.contexts = new Editor.Contexts(this);
        this.contexts.create("Editor");
        
        this.stats    = new Editor.StatTracker(this);
        this.history  = new Editor.History(this);
        this.viewport = new Editor.Viewport(this);
        this.selected = new Editor.Transformer(this);
        this.scene    = new Editor.Scene(this);
        this.renderer = new Editor.Renderer(this);
        this.controls = new Editor.Controls(this);
    } 
    
    /**
     * @protected
     */
    get _scenes() {
        return this.model.scenes;
    }
    
    set _scenes(value) {
        this.model.scenes = value;
    }

    get _scene() {
        return this.contexts.current.scene;
    }

    get _camera() {
        return this.model.camera;
    }
    
    get _helpers() {
        return this.viewport.helpers;
    }

    get _renderer() {
        return this.model.renderer;
    }

    get _rendererDom() {
        return this.model.renderer.domElement;
    }

    get _vwpDom() {
        return this.model.container;
    }
     
    get _orbitControls() {
        return this.model.orbitControls;
    }
    
    get _transformControls() {
        return this.model.transControls;
    }
    
    get _selected() {
        return this.selected.getSelected();
    }

    #getLightObj = (object) => {
        const className = object.constructor.name;

        const isLight = /^(?!.*(helper)).*light/i.test(className);
        const isHelper = /helper/i.test(className);
        const isChild = !isLight && !isHelper && !!object.parent;
        const notLight = false;

        switch (true) {
            case isLight:
                return object;

            case isHelper:
                return this.#getLightObj(object.light);

            case isChild:
                return this.#getLightObj(object.parent);

            default:
                return notLight;
        }
    };

    #getIntersects = (event) => {
        this.mouse.x = (event.clientX / this._vwpDom.offsetWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this._vwpDom.offsetHeight) * 2 + 1;

        const { raycaster } = this;

        // atualizando o raio com a posição do mouse e da câmera
        raycaster.setFromCamera(this.mouse, this._camera);

        let gizmos = [];
        let isTransformingObj = !!this._transformControls.object;

        if (isTransformingObj) {
            // pegando todos os gizmos
            gizmos =
                this._transformControls.children[0].gizmo[
                    this._transformControls.mode
                ].children;
        }

        let lightHelpers = [];
        let helpers = this.viewport.helpers;

        Object.keys(helpers).forEach((uuid) => {
            if ("light" in helpers[uuid]) lightHelpers.push(helpers[uuid]);
        });

        /* acrescentei os lightHelpers na lista do intersectObjects porque os objetos de luz
         * diretamente não são detectados pelo raycaster, somente os seus helpers, portanto:
         * colocarei o raycaster para detectar quando tocar no lightHelper, em seguida, substituo
         * todos os lightHelpers pelos objetos de luzes correspondentes.
         */
        
        const sceneObjects = this._scene.children.filter(
            (object) =>
                /(mesh|hotspot|light)/i.test(object.constructor.name) &&
                !/helper/i.test(object.constructor.name)
        );
        const objIntersects = raycaster.intersectObjects([
            ...sceneObjects,
            ...lightHelpers,
        ]);
        const gizmoIntersects = this._transformControls
            .getRaycaster()
            .intersectObjects(gizmos);

        objIntersects.forEach((intersected) => {
            const lightObj = this.#getLightObj(intersected.object);
            if (lightObj) intersected.object = lightObj;
        });

        return {
            objects: objIntersects,
            gizmos: gizmoIntersects,
        };
    };

    #handleRaycaster = (event) => {
        const intersects = this.#getIntersects(event);
        const smthIsSelected = !!this._selected;

        let intersectedObj = intersects.objects[0];
        let intersectedGizmo = intersects.gizmos[0];

        if (!this._memory.has("raycaster")) {
            this._memory.create("raycaster");
            this._memory.raycaster.set({
                description: "",
                undo: null,
                redo: null,
                transformed: false,
            });
        }

        const onObjectChange = () => {
            this.viewport.getHelper(this._selected).update();
            this._rendererDom.style.cursor = "grabbing";

            this._memory.raycaster.set({ transformed: true });

            this.trigger("editSelected", this);
        };

        if (intersectedObj && !intersectedGizmo && !smthIsSelected) {
            this._transformControls.addEventListener(
                "objectChange",
                onObjectChange
            );

            const intersectCopy = intersectedObj.object;

            const oldValues = {};
            ["position", "scale", "rotation"].forEach((attr) => {
                oldValues[attr] = {
                    x: intersectCopy[attr].x,
                    y: intersectCopy[attr].y,
                    z: intersectCopy[attr].z,
                };
            });

            this._memory.raycaster.set({
                description: `Transform object ${intersectCopy.name}`,
                undo: () => {
                    ["position", "scale", "rotation"].forEach((attr) => {
                        intersectCopy[attr].x = oldValues[attr].x;
                        intersectCopy[attr].y = oldValues[attr].y;
                        intersectCopy[attr].z = oldValues[attr].z;
                    });
                    this.viewport.getHelper(intersectCopy).update();
                },
            });

            this.selected.select(intersectCopy);
        } else if (!intersectedObj && !intersectedGizmo && smthIsSelected) {
            const intersectCopy = this._selected;

            this._rendererDom.style.cursor = "default";
            this._transformControls.removeEventListener(
                "objectChange",
                onObjectChange
            );

            // redo
            const newValues = {};
            ["position", "scale", "rotation"].forEach((attr) => {
                newValues[attr] = {
                    x: intersectCopy[attr].x,
                    y: intersectCopy[attr].y,
                    z: intersectCopy[attr].z,
                };
            });

            this._memory.raycaster.set({
                redo: () => {
                    ["position", "scale", "rotation"].forEach((attr) => {
                        intersectCopy[attr].x = newValues[attr].x;
                        intersectCopy[attr].y = newValues[attr].y;
                        intersectCopy[attr].z = newValues[attr].z;
                    });

                    this.viewport.getHelper(intersectCopy).update();
                },
            });

            if (this._memory.raycaster.transformed) {
                this.history.add({
                    description: this._memory.raycaster.description,
                    undo: this._memory.raycaster.undo,
                    redo: this._memory.raycaster.redo,
                });
            }

            this._memory.clear(["raycaster"]);

            this.selected.unselect();
        }
    };

    #handleCursorStyle = (event) => {
        const intersects = this.#getIntersects(event);
        const smthIsSelected = !!this._selected;

        const intersectedObj = intersects.objects[0];
        const intersectedGizmo = intersects.gizmos[0];

        let cursor = "default";

        if (intersectedObj && !smthIsSelected) {
            cursor = "pointer";
        } else if (intersectedGizmo) {
            cursor = "grab";
        }

        this._rendererDom.style.cursor = cursor;
    };

    addDefaultEvents() {
        this._rendererDom.addEventListener(
            "pointerdown",
            this.#handleRaycaster,
            false
        );
        this._rendererDom.addEventListener(
            "pointermove",
            this.#handleCursorStyle,
            false
        );
    }
    
    /**
     * Anexa eventos ao editor - pode anexar múltiplas funções ao mesmo evento.
     * @public
     * @param {String}   eventName - O nome do evento (sem a palavra "on").
     * @param {Function} callback  - A função que o evento executará.
     */
    on(eventName, callback) {
        eventName = eventName[0].toUpperCase() + eventName.slice(1);
        eventName = "on" + eventName;
        
        if (!(eventName in this._events)) {
            this._events[eventName] = [];
        }
        
        this._events[eventName].push(callback);
    }
    
    /**
     * 
     * @param {String} eventName 
     * @param {...Any} args 
     */
    trigger(eventName, ...args) {
        eventName = eventName[0].toUpperCase() + eventName.slice(1);
        eventName = "on" + eventName;
        
        if (eventName in this._events) {
            this._events[eventName].forEach(func => func(...args));
        }
    }

    /**
     * Inicializa o editor de acordo com as configurações pré-definidas.
     */
    init() {
        // Adicionando os helpers dos objetos de cada cena
        Object.entries(this.model.scenes).forEach(([name, scene]) => {
            scene.children.forEach((object) => {
                this.viewport.setHelper(object);

                const helper = this.viewport.getHelper(object);
                if (helper) scene.add(helper);
            });
        });

        // Criando um contexto para cada cena do modelo
        Object.entries(this.model.scenes).forEach(([name, scene]) => {
            this.contexts.create(name, scene);
        });

        this.model.animate(() => {
            this.model.orbitControls.update();
            this.stats.update();
        });

        this.addDefaultEvents();
    }

    save() {
        this.trigger("saveRenderer", this._renderer.userData);

        const modelJSON = {};

        Object.entries(this._scenes).forEach(([name, scene]) => {
            if (name == "Editor") return;

            const sceneCopy = new THREE.Scene();

            sceneCopy.background = scene.background;
            sceneCopy.environment = scene.environment;
            sceneCopy.fog = scene.fog;

            scene.children.filter((object) =>
                /(mesh|hotspot|light|TransformControls)/i.test(object.constructor.name) &&
                !/helper/i.test(object.constructor.name)
            ).forEach((object) => (
                sceneCopy.add(object.clone())
            ));
            
            sceneCopy.userData.opacityFactor = this.contexts[name].opacityFactor;
            
            const sceneJSON = sceneCopy.toJSON();

            modelJSON[name] = sceneJSON;
        });
        
        this.trigger("saveModel", modelJSON);
    }
}