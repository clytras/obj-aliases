const _dataAliases = function(data) {
    var that = this;
    this._data = data;
    this._keysSplit = ".";
    this._linkMarks = {
        root: "@",
        siblings: ">",
        parents: "~"
    };

    this.get = function(key, def, props) {
        var useAliases = props instanceof Object && 'useAliases' in props ? props.useAliases : true,
            expandString = props instanceof Object && 'expandString' in props ? props.expandString : false,
            expandStringParams = props instanceof Object && 'expandStringParams' in props ? props.expandStringParams : {};
        if(arguments.length == 1) def = undefined;
        var resolve = this.__resolve({
            key: key,
            followAliasLinks: useAliases,
            expandString: expandString,
            expandStringParams: expandStringParams
        });
        if(resolve.found) {
            return resolve.value;
        }
        return def;
    }

    this.$get = function(key, def) {
        return that.get(key, def, {useAliases: false});
    }

    this.expandString = function(key, params) {
        return that.get(key, '', { expandString: true, expandStringParams: params });
    }

    this.set = function(key, value, props) {
        var useAliases = props instanceof Object && 'useAliases' in props ? props.useAliases : true;
        var resolve = that.__resolve({key: key, setNewValue: true, newValue: value, followAliasLinks: useAliases});
        if(resolve.found) {
            return true;
        }
        return false;
    }

    this.$set = function(key, value) {
        return that.set(key, value, {useAliases: false});
    }

    this.del = function(key, props) {
        var useAliases = props instanceof Object && 'useAliases' in props ? props.useAliases : true;
        var resolve = that.__resolve({key: key, deleteIt: true, followAliasLinks: useAliases});
        if(resolve.found) {
            return true;
        }
        return false;
    }

    this.$del = function(key) {
        return that.del(key, {useAliases: false});
    }

    this.has = function(key) {
        var resolve = that.__resolve({key: key});
        return resolve.found;
    }

    this.$has = function(key) {
        return that.exists(key);
    }

    this.exists = function(key) {
        var resolve = that.__resolve({key: key, followAliasLinks: false});
        return resolve.found;
    }

    this.setLinkMarks = function(obj) {
        if("root" in obj) that._linkMarks.root = obj.root;
        if("siblings" in obj) that._linkMarks.siblings = obj.siblings;
        if("parents" in obj) that._linkMarks.parents = obj.parents;
    }

    this.setKeysSplit = function(keysSplit) {
        that._keysSplit = keysSplit;
    }

    this.__isAlias = function(key) {
        var re = new RegExp("^([" +
            that._linkMarks.root +
            that._linkMarks.siblings +
            that._linkMarks.parents +
        "])(.*)");
        var result = re.exec(key);

        return {
            result: result !== null,
            type: result ? result[1] : null,
            key: result ? result[2] : null,
            parts: result ? result[2].split(that._keysSplit) : []
        }
    }

    this.__resolve = function(props) {
        var key = props.key,
            dataroot = "dataroot" in props ? props.dataroot : null,
            setNewValue = "setNewValue" in props ? props.setNewValue : false,
            deleteIt = "deleteIt" in props ? props.deleteIt : false,
            newValue = "newValue" in props ? props.newValue : undefined,
            mustMatchFirstKey = "mustMatchFirstKey" in props ? props.mustMatchFirstKey : false,
            followAliasLinks = "followAliasLinks" in props ? props.followAliasLinks : true,
            expandString = "expandString" in props ? props.expandString : false,
            expandStringParams = new _dataAliases("expandStringParams" in props ? props.expandStringParams : {});

        var kparts = key.split(that._keysSplit),
            datacur = dataroot ? dataroot : this._data,
            notFound = false,
            prevpart = '',
            parentptrs = [datacur],
            datarootpass;

        if('currentPath' in props) {
            var cparts = props.currentPath.split(that._keysSplit);
            parentptrs = [datacur]
            for(var cpart in cparts) {
                var curckey = cparts[cpart];

                if(curckey in datacur) {
                    datacur = datacur[curckey];
                    prevpart = curckey;
                    parentptrs.push(datacur);
                }
            }
        }

        for(var kpart in kparts) {
            var curkey = kparts[kpart],
                isLast = kpart == kparts.length - 1;

            if(curkey[0] == '-' && /^-?\d+$/.test(curkey)) {
                curkey = datacur.length + parseInt(curkey);
            }

            if(datacur instanceof Object && curkey in datacur) {
                if(followAliasLinks && typeof(datacur[curkey]) === "string") {
                    var isAlias = this.__isAlias(datacur[curkey]);
                    if(!isAlias.result) {
                        datacur = datacur[curkey];
                    } else {
                        datarootpass = null;

                        switch(isAlias.type) {
                            case that._linkMarks.parents:
                                var aliasFound = false,
                                    aliasResolve = null;

                                for(var i = parentptrs.length - 2; i >= 0; i--) {
                                    aliasResolve = that.__resolve({
                                        key: isAlias.key,
                                        dataroot: parentptrs[i],
                                        setNewValue: setNewValue,
                                        newValue: newValue,
                                        deleteIt: deleteIt,
                                        mustMatchFirstKey: true
                                    });
                                    if(aliasResolve.found) {
                                        aliasFound = true;
                                        newValueSet = true;
                                        break;
                                    }
                                }
                                if(aliasFound) {
                                    parentptrs = parentptrs.slice(0, i - 1);
                                    datacur = aliasResolve.value;
                                } else {
                                    notFound = true;
                                }
                                break;
                            case that._linkMarks.siblings:
                                datarootpass = datacur;
                            case that._linkMarks.root:
                                var resolve = that.__resolve({
                                    key: isAlias.key, 
                                    dataroot: datarootpass, 
                                    setNewValue: setNewValue, 
                                    newValue: newValue,
                                    deleteIt: deleteIt
                                });
                                if(resolve.found) {
                                    datacur = resolve.value;
                                    newValueSet = true;
                                } else {
                                    notFound = true;
                                }
                                break;
                        }

                        if(notFound) {
                            break;
                        }

                        if(setNewValue) setNewValue = false;
                        if(deleteIt) deleteIt = false;
                    }
                } else {
                    datacur = datacur[curkey];
                }

                if(setNewValue) {
                    if(isLast) {
                        if(parentptrs[parentptrs.length - 1][curkey] instanceof Array) {
                            parentptrs[parentptrs.length - 1][curkey].push(newValue);
                        } else {
                            parentptrs[parentptrs.length - 1][curkey] = newValue;
                        }
                    }
                }
            } else if(setNewValue && (!mustMatchFirstKey || mustMatchFirstKey && kpart > 0)) {
                if(curkey == "[]") {
                    if(!(datacur instanceof Array)) {
                        datacur = [];
                    }
                    if(isLast) {
                        datacur.push(newValue);
                    }
                } else {
                    if(datacur instanceof Array) {
                        datacur.push({});
                        if(isLast) {
                            datacur[datacur.length - 1][curkey] = newValue;
                            datacur = datacur[datacur.length - 1][curkey];
                        } else {
                            datacur[datacur.length - 1][curkey] = {};
                            datacur = datacur[datacur.length - 1][curkey];
                        }
                    } else {
                        if(isLast) {
                            datacur[curkey] = newValue;
                        } else if(datacur instanceof Object) {
                            datacur[curkey] = {};
                        } else {
                            if(!(datacur instanceof Object)) {
                                parentptrs[parentptrs.length - 2][prevpart] = {};
                                datacur = parentptrs[parentptrs.length - 2][prevpart];
                            }
                            datacur[curkey] = {};
                        }
                        datacur = datacur[curkey];
                    }
                }
            } else {
                notFound = true;
                break;
            }
            prevpart = curkey;
            parentptrs.push(datacur);
        }

        if(!notFound) {
            if(deleteIt) {
                delete parentptrs[parentptrs.length - 2][prevpart];
                datacur = null;
            } else if(expandString && typeof(datacur) === 'string') {
                datacur = datacur.replace(/\{(.*?)\}/gi, (result, aliasKeyPath, resultPos) => {
                    const isAlias = that.__isAlias(aliasKeyPath);
                    
                    if(!isAlias.result) {
                        if(expandStringParams.has(aliasKeyPath)) {
                            return expandStringParams.get(aliasKeyPath);
                        } else {
                            var resolve = that.__resolve({
                                key: aliasKeyPath
                            });
                            if(resolve.found) {
                                return resolve.value;
                            }
                        }
                    } else {
                        switch(isAlias.type) {
                            case that._linkMarks.parents:
                                var aliasResolve = null;

                                for(var i = parentptrs.length - 2; i >= 0; i--) {
                                    aliasResolve = that.__resolve({
                                        key: isAlias.key,
                                        dataroot: parentptrs[i],
                                        setNewValue: setNewValue,
                                        mustMatchFirstKey: true
                                    });
                                    if(aliasResolve.found) {
                                        return aliasResolve.value;
                                    }
                                }
                                break;
                            case that._linkMarks.siblings:
                                datarootpass = parentptrs[parentptrs.length - 2];
                            case that._linkMarks.root:
                                var aliasResolve = that.__resolve({
                                    key: isAlias.key, 
                                    dataroot: datarootpass, 
                                });

                                if(aliasResolve.found) {
                                    return aliasResolve.value;
                                }
                                break;
                        }
                    }

                    return '';
                });
            }
        }

        return {
            found: !notFound,
            value: datacur
        }
    }
}

module.exports = _dataAliases;
