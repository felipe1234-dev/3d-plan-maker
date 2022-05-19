/**
 * Usado para editar uma instância da classe ThreeDModel.
 */
class Editor {
    /**
     * @param {ThreeDModel} model - O modelo da planta a ser editada, instância da classe ThreeDModel.
     */
    constructor(model) {
        /**
         * Usado para guardar dados temporários para operações no editor.
         * @protected 
         * @type {Editor.Memory}
         */
        this._memory = {
            /**
             * Cria um "namespace", contexto ou subpartição para os dados na memória.
             * @public
             * @method
             * @param {string} ctxName - Nome do espaço.
             * @returns {void}
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
             * @public
             * @method
             * @param   {string}  ctxName - Nome da subpartição.
             * @returns {boolean} Retorna verdadeiro se tiver a subpartição.
             */
            has(ctxName) {
                return ctxName in this;
            },

            /**
             * Cria ou modifica dados na memória.
             * @public
             * @method
             * @param {{
             *     [dataName: string]: any
             * }} params - Chave e valor do dado.
             * @returns {void}
             */
            set(params) {
                Object.entries(params).forEach(([key, value]) => {
                    this[key] = value;
                });
            },

            /**
             * Limpa/Exclui dados salvos na memória.
             * @public
             * @method
             * @param {Array<string>} keys - Lista com os nomes dos dados a serem excluídos.
             * @returns {void}
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
         * @type {{
         *     [eventName: string]: Array<(editor: Editor) => void>
         * }}
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
        
        /**
         * @public
         * @type {ThreeDModel}
         */
        this.model     = model;
        
        /**
         * @public
         * @type {THREE.Raycaster}
         */
        this.raycaster = new THREE.Raycaster();
        
        /**
         * @public
         * @type {THREE.Vector2}
         */
        this.mouse     = new THREE.Vector2();
        
        /**
         * @public
         * @type {Editor.StatTracker}
         */
        this.stats    = new Editor.StatTracker(this);
        
        /**
         * @public
         * @type {Editor.History}
         */
        this.history  = new Editor.History(this);
        
        /**
         * @public
         * @type {Editor.Contexts}
         */
        this.contexts = new Editor.Contexts(this);
        this.contexts.create("Editor", false);
         
        /**
         * @public
         * @type {Editor.Viewport}
         */
        this.viewport = new Editor.Viewport(this);
        
        /**
         * @public
         * @type {Editor.Transformer}
         */
        this.selected = new Editor.Transformer(this);
        
        /**
         * @public
         * @type {Editor.Scene}
         */
        this.scene    = new Editor.Scene(this);
        
        /**
         * @public
         * @type {Editor.Renderer}
         */
        this.renderer = new Editor.Renderer(this);
        
        /**
         * @public
         * @type {Editor.Controls}
         */
        this.controls = new EditorControls(this);
    }
    
    get _currentScene() {
        return this.contexts.current.scene;
    }
    
    get _currentContext() {
        return this.contexts.current;
    }
    
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

    /**
     * Tenta verificar se o determinado objeto está associado a um objeto de luz.
     * @private
     * @param {THREE.Object3D} obj3D
     * @returns {THREE.Light|false}
     */
    #getLightObj = (obj3D) => {
        const className = obj3D.constructor.name || "";

        const isLight = /^(?!.*(helper)).*light/i.test(className);
        const isHelper = /helper/i.test(className);
        const isChild = !isLight && !isHelper && obj3D.parent;
        const notLight = false;

        switch (true) {
            case isLight:
                return obj3D;

            case isHelper:
                return this.#getLightObj(obj3D.light);

            case isChild:
                return this.#getLightObj(obj3D.parent);

            default:
                return notLight;
        }
    }

    /**
     * Retorna os objetos onde o cursor do mouse está em cima.
     * @private
     * @param {PointerEvent} event
     * @returns {{
     *     objects: Array<THREE.Object3D>,
     *     gizmos: Array<THREE.Object3D>
     * }}
     */
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
    }

    /**
     * 
     * @private
     * @param {PointerEvent} event
     * @returns {void}
     */
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
    }

    /**
     * 
     * @private
     * @param {PointerEvent} event
     * @returns {void}
     */
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
    }

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
     * Anexa eventos ao editor - pode-se anexar múltiplas funções ao mesmo evento.
     * @public
     * @param {string} eventName - O nome do evento (sem a palavra "on").
     * @param {(editor: Editor) => void} callback  - A função que o evento executará.
     * @returns {void}
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
     * Aciona um evento.
     * @public
     * @param {string} eventName 
     * @param {...any} args 
     * @returns {void}
     */
    trigger(eventName, ...args) {
        eventName = eventName[0].toUpperCase() + eventName.slice(1);
        eventName = "on" + eventName;
        
        if (eventName in this._events) {
            this._events[eventName].forEach(func => func(...args));
        }
    }

    /**
     * Inicializa o editor de acordo com as configurações definidas.
     * @public
     * @returns {void}
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
            this.contexts.create(name, false, scene);
        });

        this.model.animate(() => {
            this.model.orbitControls.update();
            this.stats.update();
        });

        this.addDefaultEvents();
    }
    
    /**
     * Salva as edições feitas no modelo, o output do renderizador sai no 
     * evento "onSaveRenderer" e o do modelo sai no "onSaveModel".
     * @public
     * @returns {void}
     */
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
                /(mesh|hotspot|light)/i.test(object.constructor.name) &&
                !/helper|TransformControls/i.test(object.constructor.name)
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