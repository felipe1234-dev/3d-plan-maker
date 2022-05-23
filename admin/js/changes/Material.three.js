/**
 * Usado para modificar algum mapa do material facilmente
 * @param {string} mapType - Nome do parâmetro.
 * @param {{
 *     type: string
 *     refraction?: boolean,
 *     urls?: Array<string>,
 *     url?: string
 * }}              props   - Novo valor do parâmetro.
 * @returns {void} 
 */
THREE.Material.prototype.setMap = function(mapType, props) {
    const { type, ...rest } = props;

    let refraction = null;
    if ("refraction" in rest) refraction = rest.refraction;
    let loader;

    const onLoadTexture = (texture, mapping) => {
        texture.mapping = mapping;
        texture.encoding = THREE.sRGBEncoding;
        
        this.setValues({ [mapType]: texture });
    };

    switch (true) {
        case /^uv*[-\s]*(texture|mapping)$/i.test(type):
            loader = new THREE.TextureLoader();
            loader.load(rest.url, (texture) =>
                onLoadTexture(texture, THREE.UVMapping)
            );
            break;

        case /^equirect(angular)*[-\s]*(texture|mapping)$/i.test(type):
            loader = new THREE.TextureLoader();
            loader.load(rest.url, (texture) =>
                onLoadTexture(
                    texture,
                    refraction
                        ? THREE.EquirectangularRefractionMapping
                        : THREE.EquirectangularReflectionMapping
                )
            );
            break;

        case /^cube[-\s]*uv[-\s]*(texture|mapping)$/i.test(type):
            loader = new THREE.CubeTextureLoader();
            loader.load(rest.urls, (texture) => 
                onLoadTexture(
                    texture,
                    refraction
                        ? THREE.CubeUVRefractionMapping
                        : THREE.CubeUVReflectionMapping
                )
            );
            break;

        case /^cube[-\s]*(texture|mapping)$/i.test(type):
            loader = new THREE.CubeTextureLoader();
            loader.load(rest.urls, (texture) => 
                onLoadTexture(
                    texture,
                    refraction
                        ? THREE.CubeRefractionMapping
                        : THREE.CubeReflectionMapping
                )
            );
            break;

        default:
            this.setValues({ [mapType]: null });
            break;
    }
};