/**
 * Usado para setar parâmetros (ou propriedades), setáveis apenas no construtor da geometria,
 * sem desfazer a instância.
 * @param {string} param - Nome do parâmetro.
 * @param {any}    value - Novo valor do parâmetro.
 * @returns {void} 
 */
THREE.BufferGeometry.prototype.setParam = function(param, value) {
    let newGeometry = this.clone();
    newGeometry.parameters[param] = value;

    const { parameters: newParameters } = newGeometry;

    const args = [];

    Object.keys(newParameters).forEach((key) =>
        args.push(newParameters[key])
    );

    newGeometry = new THREE[this.type](...args);

    Object.keys(this).forEach((key) => {
        if ([ "uuid", "id" ].includes(key)) {
            return;
        }
        
        this[key] = newGeometry[key];
    });
};