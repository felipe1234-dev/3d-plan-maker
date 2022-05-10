class ThreeDModel {
    /**
     * @param {HTMLElement} container - Um elemento HTML no qual o modelo será renderizado.
     */
    constructor(container) {
        /**
         * @public
         * @type {HTMLElement}
         */
        this.container = container;
        
        /**
         * @typedef {Object.<string, object} SceneList - Chave é o nome da cena 
         * 
         */
        
        /**
         * @public
         * @type SceneList
         */
        this.scenes = {
            default: new THREE.Scene()
        }
        
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        
        container.appendChild(this.renderer.domElement);
        
        const fov = 75;
        const aspect = this.renderer.domElement.offsetWidth/this.renderer.domElement.offsetHeight;
        const near = 0.1;
        const far = 1000;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        
        this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.transControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
        
        const x = 0;
        const y = 10;
        const z = 10;
        this.camera.position.set(x, y, z);
        this.orbitControls.update();
        
        window.addEventListener("resize", this.#onResize);
        const resizeObserver = new ResizeObserver(this.#onResize);
        resizeObserver.observe(container);
    }
    
    /**
     * Atualiza a razão/proporção dos pixels do renderizador e da câmera (importante quando
     * o usuário redimensiona a janela).
     * @private
     * @returns {void}
     */
    #onResize = () => {
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        
        this.camera.aspect = this.renderer.domElement.offsetWidth/this.renderer.domElement.offsetHeight;
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * Método recursivo que junta as propriedades de dois ou mais objetos em um só, em todos os 
     * níveis da árvore.
     * @private
     * @param   {object}    target  - O objeto original.
     * @param   {...object} sources - Todos os objetos com os quais se quer juntar. Nota: se houver 
     * propriedades repetidas no target e na source, o valor da source tem prioridade.
     * @returns {object}              Retorna o objeto unificado.
     */
    #deepMerge(target, ...sources) {
        if (!sources.length) 
            return target;
        
        const isObject = (item) => {
            return (item && typeof item === "object" && !Array.isArray(item));
        }
            
        const source = sources.shift();
      
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                
                if (isObject(source[key])) {
                    if (!target[key]) 
                        target[key] = {}
              
                    this.#deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
                
            });
        }
      
        return this.#deepMerge(target, ...sources);
    } 
    
    /**
     * @public
     * @param {object} modelJSON          - Objeto JSON do modelo.
     * @param {object} modelJSON.nomeCena - A cena deve seguir o formato especificado pela biblioteca THREE, 
     * [aqui](https://github.com/mrdoob/three.js/wiki/JSON-Object-Scene-format-4) 
     * "nomeCena" é o nome e pode ser qualquer valor.
     * @returns {void}
     */
    loadModel(modelJSON) {
        delete this.scenes.default;  
        
        Object.entries(modelJSON).forEach(([ name, model ]) => {
            const scene = new THREE.ObjectLoader().parse(model);
            scene.userData = { ...scene.userData, ...model.metadata };
            
            this.scenes[name] = scene;
        });
    }
    
    /**
     * @public
     * @param {object} options - Objeto contendo as propriedades do renderizador.
     * @param {object} options.parameters - Propriedades do construtor. 
     * Veja (THREE WebGLRenderer)[https://threejs.org/docs/?q=renderer#api/en/renderers/WebGLRenderer].
     * @param {object} options.properties - Propriedades definíveis depois do construtor. 
     * Veja (THREE WebGLRenderer)[https://threejs.org/docs/?q=renderer#api/en/renderers/WebGLRenderer].
     * @returns {void}
     */
    loadRenderer(options) {
        const { parameters, properties } = options;
        
        this.container.removeChild(this.renderer.domElement); // removendo o canvas antigo
        
        this.renderer = new THREE.WebGLRenderer(parameters);
        this.renderer = this.#deepMerge(this.renderer, properties);
        
        this.renderer.userData = {
            parameters: parameters, 
            properties: properties 
        }
        
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        
        this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.transControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
        // os controles precisam ser atualizados junto com o renderizador
        
        this.camera.aspect = this.renderer.domElement.offsetWidth/this.renderer.domElement.offsetHeight;
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    /**
     * @callback animationCallback
     * @returns {void} 
     */
    
    /**
     * Inicializa/Anima o modelo, sem ela, quaisquer formas de movimento (como o da câmera)
     * são impossíveis.
     * @public
     * @param {animationCallback} callback - Um cllback onde você pode codar animações/movimentos.
     */
    animate(callback) {
        const startAnimation = () => {
            requestAnimationFrame(startAnimation);
            
            callback();
            
            Object.entries(this.scenes).forEach(([ name, scene ]) => {
                this.renderer.render(scene, this.camera);
                this.renderer.autoClear = false;
            });
            
            this.renderer.autoClear = true;
        }
        
        startAnimation();
    }
} 