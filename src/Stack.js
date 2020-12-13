/**
 * Simplified Java stack.
 */
module.exports = class Stack {
    count;
    storage;
    
    /**
     * Returns a new stack.
     */
    constructor() {
        /**
         * The number of objects included in this stack.
         */
        this.count = 0;

        /**
         * Stores the objects of the stack.
         */
        this.storage = {};
    }

    /**
     * Pushes a value on top of the Stack.
     * @param {T} value 
     */
    push(value) {
        this.storage[this.count] = value;
        this.count++;
    }

    /**
     * Pops a value out of the stack.
     */
    pop() {
        if (this.count === 0) {
            return undefined;
        }

        this.count--;
        const result = this.storage[this.count];
        delete this.storage[this.count];
        return result;
    }

    peek() {
        return this.storage[this.count-1];
    }

    peekSet(k, v) {
        this.storage[this.count-1][k] = v;
    }

    /**
     * Returns the count of the objects in the stack.
     */
    size() {
        return this.count;
    }

    /**
     * Returns an object at index `index`.
     * @param {number} index The index of the object to get.
     * @returns {T} The object at index `index`.
     */
    get(index) {
        return this.storage[index];
    }
}