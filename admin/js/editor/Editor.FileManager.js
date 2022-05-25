class EditorFileManager {
    /**
     * @private
     * @type {Editor}
     */
    #editor;
    /**
     * @private
     * @type {{
     *     [extension: string]: {
     *         module: string,
     *         readAs: "ArrayBuffer" | "text",
     *         onParse: (props: {
     *             loader: THREE.Loader, 
     *             data: ArrayBuffer | string, 
     *             file: File,
     *             resourceUrl: string 
     *         }) => void
     *     }
     * }}
     */
    #loaders;
    /**
     * @param {Editor} editor 
     */
    constructor(editor) {
        this.#editor = editor;
        
        this.#loaders = {
            "3dm": {
                "module": "Rhino3dmLoader",
                "readAs": "ArrayBuffer"
            },
            "3ds": {
                "module": "TDSLoader",
                "readAs": "ArrayBuffer"
            },
            "3mf": {
                module: "ThreeMFLoader",
                readAs: "ArrayBuffer",
                onParse: (props) => {
                    const { loader, data, file } = props;
                    
                    const result = loader.parse(data);
                    
                    onAdd(result, file);
                }
            },
            amf: {
                module: "AMFLoader",
                readAs: "ArrayBuffer",
                onParse: (props) => {
                    const { loader, data, file } = props;
                    
                    const result = loader.parse(data);
                    
                    onAdd(result, file);
                }
            },
            dae: {
                module: "ColladaLoader",
                readAs: "text",
                onParse: (props) => {
                    const { loader, data, resourceUrl, file } = props;
                    
                    const result = loader.parse(data, resourceUrl);
                    
                    onAdd(result.scene, file);
                }
            },
            kmz: {
                module: "KMZLoader",
                readAs: "ArrayBuffer",
                onParse: (props) => {
                    const { loader, data, file } = props;
                    
                    const result = loader.parse(data);
                    
                    onAdd(result.scene, file);
                }
            },
            wrl: {
                module: "VRMLLoader",
                readAs: "text",
                onParse: (props) => {
                    const { loader, data, resourceUrl, file } = props;
                    
                    const result = loader.parse(data, resourceUrl);
                    
                    onAdd(result, file);
                }

            case "3mf": {
                reader.addEventListener(
                    "load",
                    async function (event) {
                        const { ThreeMFLoader } = await import(
                            "../../examples/jsm/loaders/3MFLoader.js"
                        );

                        const loader = new ThreeMFLoader();
                        const object = loader.parse(event.target.result);

                        editor.execute(new AddObjectCommand(editor, object));
            },
            obj: {
                module: "OBJLoader",
                readAs: "text",
                onParse: (props) => {
                    const { loader, data, file } = props;
                    
                    const result = loader.parse(data);
                    
                    onAdd(result, file);
                }
            }
        };
        
        function onAdd(element3D, file) {
            const elem = element3D;
            
            switch (true) {
                case elem.isScene:
                    editor.contexts.create(file.name, false, elem);
                    break;
            }
                    
                case elem.isMesh: 
                    editor.scene.add(elem, {
                        position: [ 0, 0, 0 ],
                        checkForCollision: true
                    });
                    break;
            
                case elem.isGroup: 
                    elem.children.forEach((child) => onAdd(child, file));
                    break;
            }
                    
                default:
                    break;
            }
        }
    }

            case "js":
            case "json": {
                reader.addEventListener(
                    "load",
                    function (event) {
                        const contents = event.target.result;

    import(file, resourceUrl) {
        const filename = file.name;
        const extension = filename
            .match(/\.\w+$/)[0]
            .replace(".", "")
            .toLowerCase();
        const reader = new FileReader();
        
        if (!(extension in this.#loaders)) {
            alert(`Extensão de arquivo não suportada (".${extension}").`);
            return;
        }
        
        const loaderInfo = this.#loaders[extension];
        
        reader.addEventListener("load", (event) => {
            const data   = event.target.result;
            const loader = new THREE[loaderInfo.module]();
            loaderInfo.onParse({
                loader,
                data,
                file,
                resourceUrl
            });
        }, false);
        
        switch (loaderInfo.readAs) {
            case "text":
                reader.readAsText(file);

                break;
            case "ArrayBuffer": 
                reader.readAsArrayBuffer(file);
                break;
            default:
                break;
        }
    }
}
            default:
                console.error(`Unsupported file format (${extension}).`);
                break;
        }*/
}};
