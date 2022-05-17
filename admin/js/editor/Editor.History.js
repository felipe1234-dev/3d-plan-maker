/**
 * Grava, refaz e desfaz ações feitas pelo editor. 
 */
class EditorHistory {
    /**
     * @type {Editor}
     */
    #editor;
    
    /**
     * @param {Editor} editor 
     */
    constructor(editor) {
        this.#editor = editor;
        
        this.timeline = [];
        this.now = -1;
    }

    /**
     * "Rebobina" o histórico para o tempo de número index.
     * @param {number} index - O número da ação, por ex: a primeira ação tem número 0, etc.
     * @returns {void}
     */
    rewind(index) {
        if (this.now < index) {
            this.redo();
        } else {
            this.undo();
        }

        if (this.now > (this.timeline.length - 1)) {
            this.now = this.timeline.length;
            return;
        }

        if (this.now < 0) {
            this.now = -1;
            return;
        }

        if (index == this.now)
            return;

        this.rewind(index);
        
        this.#editor.trigger("historyChange", this.#editor);
    }
    
    /**
     * Verifica se a ação atual do histórico pode ser desfeita.
     * @public
     * @returns {boolean}
     */
    undoIsDisabled() {
        return this.timeline.length > 0 && this.now > -1;
    }
    
    /**
     * Desfaz a ação atual.
     * @public
     * @returns {void}
     */
    undo() {
        this.timeline[this.now].undo();
        this.timeline[this.now].always();

        this.now -= 1;

        if (this.now < 0)
            this.now = -1;
        
        this.#editor.trigger("historyChange", this.#editor);
    }
    
    /**
     * Verifica se a ação atual do histórico pode ser refeita.
     * @public
     * @returns {boolean}
     */
    redoIsDisabled() {
        return this.now == (this.timeline.length - 1) || this.timeline.length == 0;
    }
    
    /**
     * Refaz a ação atual.
     * @public
     * @returns {void}
     */
    redo() {
        this.now += 1;
        if (this.now > (this.timeline.length - 1))
            this.now = this.timeline.length;

        this.timeline[this.now].redo();
        this.timeline[this.now].always();
    
        this.#editor.trigger("historyChange", this.#editor);
    }

    /**
     * Verifica se o histórico pode ser limpado.
     * @public
     * @returns {boolean}
     */
    clearIsDisabled() {
        return this.timeline.length == 0;
    }

    /**
     * Limpa o histórico por completo.
     * @public
     * @returns {void}
     */
    clear() {
        this.timeline = [];
        this.now = 0;
        this.#editor.trigger("historyChange", this.#editor);
    }

    /**
     * Adiciona uma ação ao histórico.
     * @public
     * @param {{
     *     description: string,
     *     redo: (...any) => void,
     *     undo: (...any) => void,
     *     always: (...any) => void
     * }} props 
     * @returns {void}
     */
    add(props) {
        const { description, undo, redo, always = () => { } } = props;
        
        if (this.now < (this.timeline.length - 1))
            this.timeline.splice(this.now, this.timeline.length - (this.now + 1));

        this.timeline.push({
            description: description,
            undo: undo,
            redo: redo,
            always: always
        });

        this.now = this.timeline.length - 1;

        always();
        this.#editor.trigger("historyChange", this.#editor);
    }
}