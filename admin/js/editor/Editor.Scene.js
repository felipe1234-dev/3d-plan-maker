/**
 * Serve para editar a cena (do contexto) atual do editor.
 */
class EditorScene {
    #editor;
    
    /**
     * @param {Editor} editor - Uma instância do editor.
     */
    constructor(editor) {
        this.#editor = editor;
        
        /* Criando proxies para monitorar quando "funções de setagem" são acionadas,
         * e assim, mandar automaticamente uma mensagem ao histórico.
         */
        
        this.set = new Proxy(this.set, {
            apply: function(set, scope, args) {
                const feedHistory = args[2] === undefined ? true : args[2];
                /* Se estiver undefined, significa que o usuário não passou o argumento, 
                 * logo, o valor padrão (true) é que vale.
                 */
                let option;
                let newVal;
                let oldVal;
                let ctxName;
            
                if (feedHistory) {
                    option  = args[0];
                    newVal  = args[1];
                    oldVal  = scope.get(option);
                    ctxName = editor.contexts.current.name;
                }
                 
                set.call(scope, ...args);
                
                if (feedHistory) {
                    editor.history.add({
                        description: `${ctxName}: ${option} = ${
                            typeof newVal === "object"
                                ? JSON.stringify(newVal)
                                : newVal
                        }`,
                        undo: () => set.call(scope, option, oldVal, false),
                        redo: () => set.call(scope, option, newVal, false)
                    });
                }
            }
        });
        
        this.add = new Proxy(this.add, {
            apply: function(add, scope, args) {
                const feedHistory = args[2] === undefined ? true : args[2];
                /* Se estiver undefined, significa que o usuário não passou o argumento, 
                 * logo, o valor padrão (true) é que vale.
                 */
                
                add.call(scope, ...args);
                
                if (feedHistory) {
                    const ctxName = editor.contexts.current.name;
                    let elem3D = args[0];
                    elem3D = editor._currentScene.children.filter((child) => (
                        elem3D.uuid === child.uuid
                    ))[0]; // Para pegar a posição anterior do objeto
                    
                    editor.history.add({
                        description: `${ctxName}: ${elem3D.type} adicionado`,
                        undo: () => scope.remove(elem3D, false),
                        redo: () => add.call(scope, elem3D, {
                            position: [...elem3D.position], // Mantendo a posição (escolhida aleatoriamente ou não)
                            checkForCollision: true
                        }, false)
                    });
                }
            }
        });
        
        this.remove = new Proxy(this.remove, {
            apply: function(remove, scope, args) {
                const feedHistory = args[1] === undefined ? true : args[1];
                /* Se estiver undefined, significa que o usuário não passou o argumento, 
                 * logo, o valor padrão (true) é que vale.
                 */
                
                remove.call(scope, ...args);
                
                if (feedHistory) {
                    const elem3D  = args[0];
                    const ctxName = editor.contexts.current.name;
                    
                    editor.history.add({
                        description: `${ctxName}: ${elem3D.type} removido`,
                        undo: () => scope.add(elem3D, {
                            position: [...elem3D.position], // Mantendo a posição que o objeto estava
                            checkForCollision: true
                        }, false),
                        redo: () => remove.call(scope, elem3D, false)
                    });
                }
            }
        });
    }

    /**
     * @private
     * @param {{
     *     type: string,
     *     color?: string,
     *     url?: string,
     *     urls?: Array<string> 
     * }} props
     * @returns {void}
     */
    #setBackground(props) {
        const { type, ...rest } = props;
        let texture;

        /* A refração não altera a aparência do pano de fundo,
         * por isso, environment considera refração mas o background não.
         */
        switch (true) {
            case /^color$/i.test(type):
                const { color } = rest;
                texture = new THREE.Color(color);
                break;

            case /^uv*[-\s]*texture$/i.test(type):
                texture = new THREE.TextureLoader().load(rest.url);
                texture.mapping = THREE.UVMapping;
                break;

            case /^equirect(angular)*[-\s]*texture$/i.test(type):
                texture = new THREE.TextureLoader().load(rest.url);
                texture.mapping = THREE.EquirectangularReflectionMapping;
                break;

            case /^cube[-\s]*uv[-\s]*texture$/i.test(type):
                texture = new THREE.CubeTextureLoader().load(rest.urls);
                texture.mapping = THREE.CubeUVReflectionMapping;
                break;

            case /^cube[-\s]*texture$/i.test(type):
                texture = new THREE.CubeTextureLoader().load(rest.urls);
                texture.mapping = THREE.CubeReflectionMapping;
                break;

            default:
                this.#editor._currentScene.background = null;
                return;
        }

        this.#editor._currentScene.background = texture;
    }

    /**
     * @private
     * @param {{
     *     type: string,
     *     color?: string,
     *     url?: string,
     *     urls?: Array<string>,
     *     refraction?: boolean
     * }} props
     * @returns {void}
     */
    #setEnvironment(props) {
        const { type, ...rest } = props;
        let texture;

        switch (true) {
            case /^uv[-\s]*mapping$/i.test(type):
                texture = new THREE.TextureLoader().load(rest.url);
                texture.mapping = THREE.UVMapping;
                break;

            case /^equirect(angular)*[-\s]*mapping$/i.test(type):
                texture = new THREE.TextureLoader().load(rest.url);
                texture.mapping = !rest.refraction
                    ? THREE.EquirectangularReflectionMapping
                    : THREE.EquirectangularRefractionMapping;
                break;

            case /^cube[-\s]*mapping$/i.test(type):
                texture = new THREE.CubeTextureLoader().load(rest.urls);
                texture.mapping = !rest.refraction
                    ? THREE.CubeReflectionMapping
                    : THREE.CubeRefractionMapping;
                break;

            case /^cube[-\s]*uv[-\s]*mapping$/i.test(type):
                texture = new THREE.CubeTextureLoader().load(rest.urls);
                texture.mapping = !rest.refraction
                    ? THREE.CubeUVReflectionMapping
                    : THREE.CubeUVRefractionMapping;
                break;

            default:
                this.#editor._currentScene.environment = null;
                return;
        }

        texture.encoding = THREE.sRGBEncoding;

        this.#editor._currentScene.environment = texture;
    }

    /**
     * @private
     * @param {{
     *     type: string,
     *     color?: number | string,
     *     near?: number,
     *     far?: number,
     *     density?: number
     * }} props 
     */
    #setFog(props) {
        const { type, ...rest } = props;
        
        if (!!type && "color" in rest) {
            const { color } = rest;

            if (/linear/i.test(type)) {
                const { near, far } = rest;
                this.#editor._currentScene.fog = new THREE.Fog(color, near, far);
            } else if (/exponential/i.test(type)) {
                const { density } = rest;
                this.#editor._currentScene.fog = new THREE.FogExp2(color, density);
            }
        } else {
            this.#editor._currentScene.fog = null;
        }
    }

    /**
     * Retorna o valor de alguma propriedade da cena atual.
     * @public
     * @param {string} option - Nome ou apelido da propriedade. 
     * @returns {any}           Retorna o valor da propriedade, podendo ser de any tipos.
     */
    get(option) {
        if (/(background|environment|fog)/i.test(option)) {
            const data = this.#editor._currentScene.editorData;
            const res = data[option];
            
            return res;
        }

        // o usuário/programador pode enviar um "caminho" de objeto
        // em pontos: "prop1.prop2.prop3..."
        if (/(\w+\.)+/.test(option)) {
            return eval(`this.#editor._currentScene.${option}`);
        }

        option = option.replace(/[\s-]+([A-Z])/g, "$1");
        return this.#editor._currentScene[option];
    }
    
    /**
     * Seta alguma propriedade da cena atual.
     * @public
     * @param {string}   option      - O nome do campo a ser setado.
     * @param {any}      value       - O novo valor desse campo.
     * @param {boolean?} feedHistory - Um booleano para decidir se gravará no histórico ou não. Padrão é true.
     * @returns {void}
     */
    set(option, value, feedHistory = true) {
        if (/user[\s-]*Data/i.test(option)) {
            this.#editor._currentScene.userData = value;
        } else if (/background/i.test(option)) {
            this.#setBackground(value);
        } else if (/environment|env(ironment)*[\s-]*map/i.test(option)) {
            this.#setEnvironment(value);
        } else if (/fog/i.test(option)) {
            this.#setFog(value);
        } else if (/(\w+\.)+/.test(option)) {
            eval(`this.#editor._currentScene.${option} = value`);
        } else {
            this.#editor._currentScene[option] = value;
        }
    }
    
    /**
     * Calcula o espaço total que o objeto ocupa.
     * @private
     * @param {THREE.Object3D} cmpObject - O elemento cuja posição será setada.
     * @returns {{
     *     x: { start: number, end: number },
     *     y: { start: number, end: number },
     *     z: { start: number, end: number }
     * }}
     */
    #calcIntervals(cmpObject) {
        const { position, scale } = cmpObject;
        const intervals = {
            x: { start: null, end: null },
            y: { start: null, end: null },
            z: { start: null, end: null }
        };
        const lengths = {
            x: 1,
            y: 1,
            z: 1
        };

        if ("geometry" in cmpObject && "parameters" in cmpObject.geometry) {
            const params = cmpObject.geometry.parameters;

            lengths.x =
                "width" in params
                    ? params.width
                    : "radius" in params
                    ? params.radius
                    : 1;
            lengths.y =
                "height" in params
                    ? params.height
                    : "radius" in params
                    ? params.radius
                    : 1;
            lengths.z =
                "depth" in params
                    ? params.depth
                    : "radius" in params
                    ? params.radius
                    : 1;
        }

        intervals.x.start = position.x - (scale.x * lengths.x) / 2;
        intervals.x.end = position.x + (scale.x * lengths.x) / 2;

        intervals.y.start = position.y - (scale.y * lengths.y) / 2;
        intervals.y.end = position.y + (scale.y * lengths.y) / 2;

        intervals.z.start = position.z - (scale.z * lengths.z) / 2;
        intervals.z.end = position.z + (scale.z * lengths.z) / 2;

        return intervals;
    }

    /**
     * Verifica se os intervalos estão sobrepostos.
     * @private
     * @param {{
     *     x: { start: number, end: number },
     *     y: { start: number, end: number },
     *     z: { start: number, end: number }
     * }} intervals1 - Objeto retornado por EditorScene.#calcIntervals do objeto 1.
     * @param {{
     *     x: { start: number, end: number },
     *     y: { start: number, end: number },
     *     z: { start: number, end: number }
     * }} intervals2 - Objeto retornado por EditorScene.#calcIntervals do objeto 2.
     * @returns {boolean}
     */
    #collided(intervals1, intervals2) {
        return (
            ((intervals1.x.start >= intervals2.x.start &&
                intervals1.x.start <= intervals2.x.end) ||
                (intervals2.x.start >= intervals1.x.start &&
                    intervals2.x.start <= intervals1.x.end)) &&
            ((intervals1.y.start >= intervals2.y.start &&
                intervals1.y.start <= intervals2.y.end) ||
                (intervals2.y.start >= intervals1.y.start &&
                    intervals2.y.start <= intervals1.y.end)) &&
            ((intervals1.z.start >= intervals2.z.start &&
                intervals1.z.start <= intervals2.z.end) ||
                (intervals2.z.start >= intervals1.z.start &&
                    intervals2.z.start <= intervals1.z.end))
        );
    }
    
    /**
     * Seta uma posição aleatória ao objeto, recursivamente para não sobrescrever a posição
     * de outro objeto. Retorna
     * @private
     * @param {THREE.Object3D} element3D - O elemento cuja posição será setada.
     * @returns {{
     *     objec1: {
     *         x: { start: number, end: number },
     *         y: { start: number, end: number },
     *         z: { start: number, end: number }
     *     },
     *     objec2: {
     *         x: { start: number, end: number },
     *         y: { start: number, end: number },
     *         z: { start: number, end: number }
     *     }
     * } | null}
     */
    #checkForCollision(element3D) {
        let result = null;

        this.#editor._currentScene.children.every((item) => {
            if (
                this.#collided(
                    this.#calcIntervals(element3D),
                    this.#calcIntervals(item)
                ) &&
                element3D !== item
            ) {
                result = {
                    object1: this.#calcIntervals(element3D),
                    object2: this.#calcIntervals(item),
                };

                return false;
            }
            return true;
        });

        return result;
    }
    
    /**
     * Seta uma posição aleatória ao objeto recursivamente para não sobrescrever a posição
     * de outro objeto.
     * @private
     * @param {THREE.Object3D} element3D - O elemento cuja posição será setada.
     * @returns {void}
     */
    #setRandomPosition(element3D) {
        const { position } = element3D;

        if (this.#checkForCollision(element3D)) {
            const axes = ["x", "y", "z"];
            const randAxis = axes[parseInt(Math.random() * 3)];
            const objThatsOver = this.#checkForCollision(element3D).object2;

            const { start, end } = objThatsOver[randAxis];
            position[randAxis] = Math.random() * Math.abs(start - end) + end;
        }

        element3D.position.set(position.x, position.y, position.z);

        if (this.#checkForCollision(element3D)) {
            this.#setRandomPosition(element3D);
        }
    }
    
    /**
     * @public
     * @param {THREE.Object3D} element3D - O elemento a ser removido da cena.
     * @param {boolean?} feedHistory     - Booleano que determina se a ação será gravada no histórico. Padrão é true.
     * @returns {void}
     */
    remove(element3D, feedHistory = true) {
        if (this.#editor.selected.ref === element3D) {
            this.#editor.selected.unselect();
        }

        this.#editor.viewport.removeHelper(element3D);
    }
 
    /**
     * @public
     * @param {THREE.Object3D} element3D - O elemento a ser adicionado.
     * @param {{
     *     position: [x: number, y: number, z: number],
     *     checkForCollision: boolean
     * }} props - Objeto especificando a posição e se deve checar porcolisão (ou seja, se a posição definida já for ocupada,
     * aleatoriamente escolhe outra).  
     * @param {boolean?} feedHistory - Booleano que determina se a ação será gravada no histórico. Padrão é true.
     * @returns {void}
     */
    add(element3D, props, feedHistory = true) {
        const { position, checkForCollision } = props;
        const elem3D = element3D;

        if (!!position && position.length === 3) {
            if (checkForCollision) {
                this.#setRandomPosition(elem3D);
            } else {
                elem3D.position.set(...position);
            }
        }

        this.#editor._currentScene.add(elem3D);
        this.#editor.viewport.setHelper(elem3D);

        const helper = this.#editor.viewport.getHelper(elem3D);
        this.#editor._currentScene.add(helper);
    }
}