module.exports = class Return {
    token;
    value;
    type;
    
    constructor(t, v) {
        this.token = t;
        this.value = v;
        this.type = "RETURN";
    }
}