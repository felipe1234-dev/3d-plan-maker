Editor.Scene = class {
    #editor;
    
    constructor(editor) {
        this.#editor = editor;
    }

    #setBackground({ type, ...rest }) {
        let texture;

        // a refração não altera a aparência do pano de fundo
        // por isso environment considera refração mas o background não

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
                this.#editor._scene.background = null;
                return;
        }

        this.#editor._scene.background = texture;
    }

    #setEnvironment({ type, ...rest }) {
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
                this.#editor._scene.environment = null;
                return;
        }

        texture.encoding = THREE.sRGBEncoding;

        this.#editor._scene.environment = texture;
    }

    #setFog({ type, ...rest }) {
        if (!!type && "color" in rest) {
            const { color } = rest;

            if (/linear/i.test(type)) {
                const { near, far } = rest;
                this.#editor._scene.fog = new THREE.Fog(color, near, far);
            } else if (/exponential/i.test(type)) {
                const { density } = rest;
                this.#editor._scene.fog = new THREE.FogExp2(color, density);
            }
        } else {
            this.#editor._scene.fog = null;
        }
    }

    get(option) {
        if (/(background)|(environment)|(fog)/i.test(option)) {
            const data = this.#editor._scene.editorData;
            const res = data[option];
            
            return res;
        }

        // o usuário/programador pode enviar um "caminho" de objeto
        // em pontos: "prop1.prop2.prop3..."
        if (/(\w+\.)+/.test(option)) {
            return eval(`this.#editor._scene.${option}`);
        }

        option = option.replace(/[\s-]+([A-Z])/g, "$1");
        return this.#editor._scene[option];
    }

    set(option, value, feedHistory = true) {
        if (!this.#editor._memory.has(this.#editor._scene.uuid))
            this.#editor._memory.create(this.#editor._scene.uuid);

        if (!this.#editor._memory[this.#editor._scene.uuid].has(option)) {
            this.#editor._memory[this.#editor._scene.uuid].set({
                [option]: this.get(option),
            });
        }

        if (/user[\s-]*Data/i.test(option)) {
            this.#editor._scene.userData = value;
        } else if (/background/i.test(option)) {
            this.#setBackground(value);
        } else if (/environment|env(ironment)*[\s-]*map/i.test(option)) {
            this.#setEnvironment(value);
        } else if (/fog/i.test(option)) {
            this.#setFog(value);
        } else if (/(\w+\.)+/.test(option)) {
            eval(`this.#editor._scene.${option} = value`);
        } else {
            this.#editor._scene[option] = value;
        }

        if (feedHistory) {
            const oldValueCopy = this.#editor._memory[this.#editor._scene.uuid][option];

            this.#editor.history.add({
                description: `Set scene.${option} = ${
                    typeof value == "object" ? JSON.stringify(value) : value
                }`,
                undo: () => this.set(option, oldValueCopy, false),
                redo: () => this.set(option, value, false),
                always: () => this.#editor.save(),
            });

            this.#editor._memory.clear([this.#editor._scene.uuid]);
        }
    }

    // ---

    #calcIntervals(cmpObject) {
        const { position, scale } = cmpObject;
        const intervals = {
            x: { start: null, end: null },
            y: { start: null, end: null },
            z: { start: null, end: null },
        };
        const lengths = {
            x: 1,
            y: 1,
            z: 1,
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

    #checkForCollision(object) {
        let result = null;

        this.#editor._scene.children.every((item) => {
            if (
                this.#collided(
                    this.#calcIntervals(object),
                    this.#calcIntervals(item)
                ) &&
                object !== item
            ) {
                result = {
                    object1: this.#calcIntervals(object),
                    object2: this.#calcIntervals(item),
                };

                return false;
            }
            return true;
        });

        return result;
    }

    #setRandomPosition(object) {
        const { position } = object;

        if (this.#checkForCollision(object)) {
            const axes = ["x", "y", "z"];
            const randAxis = axes[parseInt(Math.random() * 3)];
            const objThatsOver = this.#checkForCollision(object).object2;

            const { start, end } = objThatsOver[randAxis];
            position[randAxis] = Math.random() * Math.abs(start - end) + end;
        }

        object.position.set(position.x, position.y, position.z);

        if (this.#checkForCollision(object)) this.#setRandomPosition(object);
    }

    #addHotSpot({ position, material, checkForCollision }) {
        material = new THREE.HotSpotMaterial(material);
        const object = new THREE.HotSpot(material);
        object.name = "HotSpot";

        if (!!position && position.length === 3) {
            if (checkForCollision) {
                this.#setRandomPosition(object);
            } else {
                object.position.set(...position);
            }
        }

        this.#editor._scene.add(object);
        this.#editor.viewport.setHelper(object);

        const boxHelper = this.#editor.viewport.getHelper(object);
        this.#editor._scene.add(boxHelper);

        return object;
    }

    #addLight({ position, type, args, checkForCollision }) {
        const light =
            args.length > 0 ? new THREE[type](...args) : new THREE[type]();
        light.name = type;

        if (!!position && position.length === 3) {
            if (checkForCollision) {
                this.#setRandomPosition(light);
            } else {
                light.position.set(...position);
            }
        }

        this.#editor._scene.add(light);
        this.#editor.viewport.setHelper(light);

        const lightHelper = this.#editor.viewport.getHelper(light);
        if (lightHelper) this.#editor._scene.add(lightHelper);

        return light;
    }

    #addGeometry({
        position,
        geometry: geomSets,
        material: matsets,
        checkForCollision,
    }) {
        const { type: geometryName, args: geometryArgs } = geomSets;
        const { type: materialName, params: materialParams } = matsets;

        const geometry =
            geometryArgs.length > 0
                ? new THREE[geometryName](...geometryArgs)
                : new THREE[geometryName]();
        const material = new THREE[materialName](materialParams);

        const object = new THREE.Mesh(geometry, material);
        object.name = geometryName;

        if (!!position && position.length === 3) {
            if (checkForCollision) {
                this.#setRandomPosition(object);
            } else {
                object.position.set(...position);
            }
        }

        this.#editor._scene.add(object);
        this.#editor.viewport.setHelper(object);

        const boxHelper = this.#editor.viewport.getHelper(object);
        this.#editor._scene.add(boxHelper);

        return object;
    }

    #add(object) {
        this.#editor.viewport.setHelper(object);

        this.#editor._scene.add(object);
        this.#editor._scene.add(this.#editor.viewport.getHelper(object));
    }

    #remove(object) {
        if (this.#editor.selected.ref === object) this.#editor.selected.unselect();

        this.#editor._scene.remove(object);
        this.#editor._scene.remove(this.#editor.viewport.getHelper(object));

        delete this.#editor._helpers[object.uuid];
    }

    add(type, props, feedHistory = true) {
        if (!this.#editor._memory.has(this.#editor._scene.uuid))
            this.#editor._memory.create(this.#editor._scene.uuid);

        let object;

        if (/geometry/i.test(type)) {
            object = this.#addGeometry(props);
        } else if (/light/i.test(type)) {
            object = this.#addLight(props);
        } else if (/hotspot/i.test(type)) {
            object = this.#addHotSpot(props);
        }

        if (!object) return;

        if (!this.#editor._memory[this.#editor._scene.uuid].has(object.uuid)) {
            this.#editor._memory[this.#editor._scene.uuid].set({
                [object.uuid]: object,
            });
        }

        if (feedHistory) {
            const objectCopy = this.#editor._memory[this.#editor._scene.uuid][object.uuid];

            this.#editor.history.add({
                description: `Add ${type} ${object.name}`,
                undo: () => this.#remove(objectCopy),
                redo: () => this.#add(objectCopy),
                always: () => this.#editor.save(),
            });

            this.#editor._memory.clear([this.#editor._scene.uuid]);
        }
    }
};
