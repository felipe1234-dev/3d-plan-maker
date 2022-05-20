/**
 * Usado para editar uma instância da classe ThreeDModel.
 */
class Editor {
    /**
     * @param {ThreeDModel} model - O modelo da planta a ser editada, instância da classe ThreeDModel.
     */
    constructor(model) {
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
        this.model = model;
        
        /**
         * @public
         * @type {THREE.Raycaster}
         */
        this.raycaster = new THREE.Raycaster();
        
        /**
         * @public
         * @type {THREE.Vector2}
         */
        this.mouse = new THREE.Vector2();
        
        /**
         * @public
         * @type {EditorStatTracker}
         */
        this.stats = new EditorStatTracker(this);
        
        /**
         * @public
         * @type {EditorHistory}
         */
        this.history = new EditorHistory(this);
        
        /**
         * @public
         * @type {EditorContexts}
         */
        this.contexts = new EditorContexts(this);
        this.contexts.create("Editor", false);
         
        /**
         * @public
         * @type {EditorViewport}
         */
        this.viewport = new EditorViewport(this);
        
        /**
         * @public
         * @type {Editor3DElement}
         */
        this.selected = new Editor3DElement(this);
        
        /**
         * @public
         * @type {EditorScene}
         */
        this.scene = new EditorScene(this);
        
        /**
         * @public
         * @type {EditorRenderer}
         */
        this.renderer = new EditorRenderer(this);
        
        /**
         * @public
         * @type {EditorControls}
         */
        this.controls = new EditorControls(this);
        
        /**
         * @public
         * @type {EditorFileManager}
         */
        this.fileManager = new EditorFileManager(this);
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
        
        const sceneObjects = this._currentScene.children.filter(
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
        const smthIsSelected = !!this.selected.ref;

        let intersectedElem  = intersects.objects[0];
        let intersectedGizmo = intersects.gizmos[0];

        const onObjectChange = () => {
            this.viewport.getHelper(this.selected.ref).update();
            this._rendererDom.style.cursor = "grabbing";
            
            localStorage.setItem("transformed", "1");
            
            this.trigger("editSelected", this);
        };

        if (intersectedElem && !intersectedGizmo && !smthIsSelected) {
            this._transformControls.addEventListener(
                "objectChange",
                onObjectChange
            );
            
            this.selected.select(intersectedElem.object);
            
            localStorage.setItem("orig scale", JSON.stringify(this.selected.ref.scale));
            localStorage.setItem("orig position", JSON.stringify(this.selected.ref.position));
            localStorage.setItem("orig rotation", JSON.stringify(this.selected.ref.rotation));
        } else if (!intersectedElem && !intersectedGizmo && smthIsSelected) {
            this._rendererDom.style.cursor = "default";
            this._transformControls.removeEventListener(
                "objectChange",
                onObjectChange
            );
            
            if (localStorage.getItem("transformed")) {
                const elem3D = this.selected.ref;
                
                const newPosition = JSON.parse(JSON.stringify(elem3D.position));
                const newScale = JSON.parse(JSON.stringify(elem3D.scale));
                const newRotation = JSON.parse(JSON.stringify(elem3D.rotation));
                
                const oldScale = JSON.parse(localStorage.getItem("orig scale"));
                const oldPosition = JSON.parse(localStorage.getItem("orig position"));
                const oldRotation = JSON.parse(localStorage.getItem("orig rotation"));
                
                this.history.add({
                    description: 
                        `Mudou o elemento "${
                            this.selected.ref.name
                        }" da cena "${
                            this._currentContext.name
                        }" com o cursor`,
                    redo: () => {
                        ["x", "y", "z"].forEach((axis) => {
                            elem3D.position[axis] = newPosition[axis];
                            elem3D.scale[axis] = newScale[axis];
                            elem3D.rotation[axis] = newRotation["_" + axis];
                        });
                    },
                    undo: () => {
                        ["x", "y", "z"].forEach((axis) => {
                            elem3D.position[axis] = oldPosition[axis];
                            elem3D.scale[axis] = oldScale[axis];
                            elem3D.rotation[axis] = oldRotation["_" + axis];
                        });
                    },
                    always: () => this.save()
                });
                
                localStorage.removeItem("transformed");
            }

            localStorage.removeItem("orig scale");
            localStorage.removeItem("orig position");
            localStorage.removeItem("orig rotation");
            
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
        const smthIsSelected = !!this.selected.ref;

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
     * Inicializa o editor de acordo com as configurações definidas.
     * @public
     * @returns {void}
     */
    init() {
        // Adicionando os helpers dos objetos de cada cena
        Object.entries(this.model.scenes).forEach(([name, scene]) => {
            scene.children.forEach((object3D) => {
                this.viewport.setHelper(object3D);

                const helper = this.viewport.getHelper(object3D);
                if (helper) scene.add(helper);
            });
        });

        // Criando um contexto para cada cena do modelo
        Object.entries(this.model.scenes).forEach(([name, scene]) => {
            this.contexts.create(name, false, scene);
        });
        
        this.contexts[Object.keys(this.model.scenes)[0]].select();
        
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
            
            if (this._currentContext.name !== name && "materials" in modelJSON[name]) {
                modelJSON[name].materials.forEach((material) => {
                    material.opacity = material.opacity ?? 1;
                    material.opacity /= this._currentContext.opacityFactor;
                    
                    if (material.opacity > 1) 
                        material.opacity = 1;
                    
                    if (material.opacity < 0) 
                        material.opacity = 0;
                });
            }
        });
        
        this.trigger("saveModel", modelJSON);
    }
}