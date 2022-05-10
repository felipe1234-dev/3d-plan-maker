Editor.History = class {
    #editor;
    constructor(editor) {
        this.#editor = editor;
        this.timeline = [];
        this.now = -1;
    }

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

    undoIsDisabled() {
        return this.timeline.length > 0 && this.now > -1;
    }

    undo() {
        this.timeline[this.now].undo();
        this.timeline[this.now].always();

        this.now -= 1;

        if (this.now < 0)
            this.now = -1;
        
        this.#editor.trigger("historyChange", this.#editor);
    }

    redoIsDisabled() {
        return this.now == (this.timeline.length - 1) || this.timeline.length == 0;
    }

    redo() {
        this.now += 1;
        if (this.now > (this.timeline.length - 1))
            this.now = this.timeline.length;

        this.timeline[this.now].redo();
        this.timeline[this.now].always();
    
        this.#editor.trigger("historyChange", this.#editor);
    }

    clearIsDisabled() {
        return this.timeline.length == 0;
    }

    clear() {
        this.timeline = [];
        this.now = 0;
        this.#editor.trigger("historyChange", this.#editor);
    }

    add({ description, undo, redo, always = () => { } }) {
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