// Container class for tuples with (user property, property value)
class MutedUserProp {
    constructor(prop_type, prop_val) {
        this.prop_type = prop_type;
        this.prop_val = prop_val;
    }

    set_val(val) {
        this.prop_val = val;
    }
}
