const _dataAliases = function (data) {
    var that = this;
    this._data = data;
    this._keysSplit = '.';
    this._paramsKeyIndicator = '#';
    this._linkMarks = {
        root: '@',
        siblings: '>',
        parents: '~',
    };
    this._customPipes = {};

    this.get = function (key, def, props) {
        var useAliases = props instanceof Object && 'useAliases' in props ? props.useAliases : true,
            expandString = props instanceof Object && 'expandString' in props ? props.expandString : false,
            expandStringParams = props instanceof Object && 'expandStringParams' in props ? props.expandStringParams : {};
        if (arguments.length == 1) def = undefined;
        var resolve = this.__resolve({
            key: key,
            followAliasLinks: useAliases,
            expandString: expandString,
            expandStringParams: expandStringParams,
        });
        if (resolve.found) {
            return resolve.value;
        }
        return def;
    }

    this.$get = function (key, def) {
        return that.get(key, def, { useAliases: false });
    }

    this.expandString = function (key, params) {
        return that.get(key, '', { expandString: true, expandStringParams: params });
    }

    this.set = function (key, value, params) {
        var useAliases = params instanceof Object && 'useAliases' in params ? params.useAliases : true;
        var resolve = that.__resolve({ key: key, setNewValue: true, newValue: value, followAliasLinks: useAliases });
        if (resolve.found) {
            return true;
        }
        return false;
    }

    this.$set = function (key, value) {
        return that.set(key, value, { useAliases: false });
    }

    this.__makeKey = function() {
        var parts = [];
        var i;
        for (i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (arg || arg === 0) {
                parts.push(arg);
            }
        }
        return parts.join('.');
    }

    this.merge = function (data, key, params) {
        var prop;

        if (!(data instanceof Object) && !key) {
            throw new Error('Cant set primitive value to data root');
        }

        for (prop in data) {
            var value = data[prop];

            if (value instanceof Object) {
                if (value instanceof Array) {
                    var i;
                    for (i = 0; i < value.length; i++) {
                        that.$set(that.__makeKey(key, prop, '[]'), value[i]);
                    }
                } else {
                    that.merge(value, that.__makeKey(key, prop), params);
                }
            } else {
                that.$set(that.__makeKey(key, prop), value);
            }
        }
    }

    this.del = function (key, props) {
        var useAliases = props instanceof Object && 'useAliases' in props ? props.useAliases : true;
        var resolve = that.__resolve({ key: key, deleteIt: true, followAliasLinks: useAliases });
        if (resolve.found) {
            return true;
        }
        return false;
    }

    this.$del = function (key) {
        return that.del(key, { useAliases: false });
    }

    this.has = function (key) {
        if (that._data && Object.keys(that._data).length) {
            var resolve = that.__resolve({ key: key });
            return resolve.found;
        }
        return false;
    }

    this.$has = function (key) {
        return that.exists(key);
    }

    this.exists = function (key) {
        if (that._data && Object.keys(that._data).length) {
            var resolve = that.__resolve({ key: key, followAliasLinks: false });
            return resolve.found;
        }
        return false;
    }

    this.setLinkMarks = function (obj) {
        if ('root' in obj) that._linkMarks.root = obj.root;
        if ('siblings' in obj) that._linkMarks.siblings = obj.siblings;
        if ('parents' in obj) that._linkMarks.parents = obj.parents;
    }

    this.setKeysSplit = function (keysSplit) {
        that._keysSplit = keysSplit;
    }

    this.setCustomPipes = function (pipes) {
        that._customPipes = pipes;
    }

    this.__isAliasWithArgs = function (value) {
        if (
            value instanceof Array &&
            value.length === 2 &&
            typeof value[0] === 'string'
        ) {
            var isAlias = this.__isAlias(value[0]);
            return isAlias.result;
        }
        return false;
    }

    this.__isAlias = function (key) {
        var re = new RegExp('^([' +
            that._linkMarks.root +
            that._linkMarks.siblings +
            that._linkMarks.parents +
        '])(.*)');
        var result = re.exec(key);

        return {
            result: result !== null,
            type: result ? result[1] : null,
            key: result ? result[2] : null,
            parts: result ? result[2].split(that._keysSplit) : [],
        };
    }

    this.__parseKey = function (key) {
        var re = new RegExp('^([' +
            that._linkMarks.root +
            that._linkMarks.siblings +
            that._linkMarks.parents +
        ']?)(' + that._paramsKeyIndicator + '?)([A-z0-9\-.]+)[|]?(.*)');
        var result = re.exec(key);

        return {
            type: result[1],
            key: result[3],
            fullKey: result[1] + result[3],
            isParamKey: result[2] === that._paramsKeyIndicator,
            functions: result[4],
        };
    }

    this.__applyFunctions = function (value, functions) {
        if (typeof functions === 'string' && functions.length > 0) {
            var fns = functions.split(',');
            var result = value;
    
            for (var i = 0; i < fns.length; i++) {
                var fn = fns[i].toLowerCase().trim();
                switch (fn) {
                    case 'upper': {
                        result = result.toUpperCase();
                        break;
                    }
                    case 'lower': {
                        result = result.toLowerCase();
                        break;
                    }
                    default: {
                        if (fn in that._customPipes && typeof that._customPipes[fn] === 'function') {
                            result = that._customPipes[fn](result);
                        }
                    }
                }
            }
            return result;
        }
        return value;
    }

    this.__resolve = function (props) {
        var thekey = props.key,
            dataroot = 'dataroot' in props ? props.dataroot : null,
            setNewValue = 'setNewValue' in props ? props.setNewValue : false,
            deleteIt = 'deleteIt' in props ? props.deleteIt : false,
            newValue = 'newValue' in props ? props.newValue : undefined,
            mustMatchFirstKey = 'mustMatchFirstKey' in props ? props.mustMatchFirstKey : false,
            followAliasLinks = 'followAliasLinks' in props ? props.followAliasLinks : true,
            expandString = 'expandString' in props ? props.expandString : false,
            expandStringParams = '_expandStringParams' in props
                ? props._expandStringParams
                : new _dataAliases(props.expandStringParams || {});

        var parsed = this.__parseKey(thekey);
        var key;

        if (parsed.isParamKey && expandStringParams.has(parsed.key)) {
            key = parsed.type + expandStringParams.get(parsed.key);
        } else {
            key = parsed.fullKey
        }

        var kparts = parsed.key.split(that._keysSplit),
            datacur = dataroot ? dataroot : this._data,
            notFound = false,
            prevpart = '',
            parentptrs = [datacur];

        if ('currentPath' in props) {
            var cparts = props.currentPath.split(that._keysSplit);
            parentptrs = [datacur]
            for (var cpart in cparts) {
                var curckey = cparts[cpart];

                if (curckey in datacur) {
                    datacur = datacur[curckey];
                    prevpart = curckey;
                    parentptrs.push(datacur);
                }
            }
        }

        if (!expandString || !(expandString && expandStringParams.has(key))) {
            for (var kpart = 0; kpart < kparts.length; kpart++) {
                var curkey = kparts[kpart],
                    isLast = kpart === kparts.length - 1;
                var nextpart = !isLast ? kparts[kpart + 1] : null;

                if (curkey[0] === '-' && /^-?\d+$/.test(curkey)) {
                    curkey = datacur.length + parseInt(curkey);
                }

                if (datacur instanceof Object && curkey in datacur) {
                    if (
                        followAliasLinks &&
                        (
                            typeof datacur[curkey] === 'string' ||
                            datacur[curkey] instanceof Array
                        )
                    ) {
                        let currentValue = datacur[curkey];
                        if (this.__isAliasWithArgs(datacur[curkey])) {
                            currentValue = datacur[curkey][0];
                            expandStringParams.merge(datacur[curkey][1]);
                        }

                        var isAlias = this.__isAlias(currentValue);

                        if (!isAlias.result) {
                            datacur = datacur[curkey];
                        } else {
                            switch (isAlias.type) {
                                case that._linkMarks.parents: {
                                    var aliasFound = false,
                                        aliasResolve = null;

                                    for (var i = parentptrs.length - 2; i >= -1; i--) {
                                        aliasResolve = that.__resolve({
                                            key: isAlias.key,
                                            dataroot: parentptrs[i],
                                            setNewValue: setNewValue,
                                            newValue: newValue,
                                            deleteIt: deleteIt,
                                            mustMatchFirstKey: true,
                                            _expandStringParams: expandStringParams,
                                        });

                                        if (aliasResolve.found) {
                                            aliasFound = true;
                                            newValueSet = true;
                                            break;
                                        }
                                    }

                                    if (aliasFound) {
                                        parentptrs = parentptrs.slice(0, i - 1);
                                        datacur = aliasResolve.value;
                                    } else {
                                        notFound = true;
                                    }
                                    break;
                                }
                                case that._linkMarks.siblings:
                                case that._linkMarks.root: {
                                    var useKey;

                                    if (isAlias.type === that._linkMarks.siblings) {
                                        var pathProps = key.split(that._keysSplit);
                                        if (pathProps.length >= 2) {
                                            pathProps.splice(pathProps.length - 1, 1, isAlias.key);
                                            useKey = pathProps.join(that._keysSplit);
                                        } else {
                                            useKey = isAlias.key;
                                        }
                                    } else {
                                        useKey = isAlias.key;
                                    }

                                    var resolve = that.__resolve({
                                        key: useKey, 
                                        setNewValue: setNewValue, 
                                        newValue: newValue,
                                        deleteIt: deleteIt,
                                        _expandStringParams: expandStringParams,
                                    });

                                    if (resolve.found) {
                                        datacur = resolve.value;
                                        newValueSet = true;
                                    } else {
                                        notFound = true;
                                    }

                                    break;
                                }
                            }

                            if (notFound) {
                                break;
                            }

                            if (setNewValue) setNewValue = false;
                            if (deleteIt) deleteIt = false;
                        }
                    } else {
                        datacur = datacur[curkey];
                    }

                    if (setNewValue) {
                        if (isLast) {
                            if (parentptrs[parentptrs.length - 1][curkey] instanceof Array) {
                                parentptrs[parentptrs.length - 1][curkey].push(newValue);
                            } else {
                                parentptrs[parentptrs.length - 1][curkey] = newValue;
                            }
                        }
                    }
                } else if (setNewValue && (!mustMatchFirstKey || mustMatchFirstKey && kpart > 0)) {
                    if (curkey === '[]') {
                        
                        if (!(datacur instanceof Array)) {
                            datacur = [];
                        }
                        if (isLast) {
                            datacur.push(newValue);
                        }
                    } else {
                        if (datacur instanceof Array) {
                            datacur.push({});
                            if (isLast) {
                                datacur[datacur.length - 1][curkey] = newValue;
                                datacur = datacur[datacur.length - 1][curkey];
                            } else {
                                datacur[datacur.length - 1][curkey] = {};
                                datacur = datacur[datacur.length - 1][curkey];
                            }
                        } else {
                            if (isLast) {
                                datacur[curkey] = newValue;
                            } else if (datacur instanceof Object) {
                                if (nextpart === '[]') {
                                    datacur[curkey] = [];
                                } else {
                                    datacur[curkey] = {};
                                }
                            } else {
                                if (!(datacur instanceof Object)) {
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
        }

        if (!notFound) {
            if (deleteIt) {
                delete parentptrs[parentptrs.length - 2][prevpart];
                datacur = null;
            } else if (expandString && typeof(datacur) === 'string') {
                datacur = datacur.replace(/\{(.*?)\}/gi, (result, aliasKeyPath, resultPos) => {
                    var pars = this.__parseKey(aliasKeyPath);
                    var withFunctions = function (value) {
                        if (pars.functions && typeof value === 'string') {
                            return that.__applyFunctions(value, pars.functions);
                        }
                        return value;
                    }
                    var useKey = pars.key;
                    let isAlias;

                    if (pars.isParamKey) {
                        if (expandStringParams.has(pars.key)) {
                            useKey = expandStringParams.get(pars.key);
                        } else if (expandStringParams.$has(pars.key)) {
                            useKey = expandStringParams.$get(pars.key);
                        }


                        isAlias = that.__isAlias(useKey);
                        if (!isAlias.result) {
                            isAlias = that.__isAlias(aliasKeyPath);
                        }
                    } else {
                        isAlias = that.__isAlias(aliasKeyPath);
                    }

                    if (!isAlias.result) {
                        if (expandStringParams.has(useKey)) {
                            return withFunctions(expandStringParams.get(useKey));
                        }

                        var resolve = that.__resolve({
                            key: useKey,
                            _expandStringParams: expandStringParams,
                        });

                        if (resolve.found) {
                            return withFunctions(resolve.value);
                        }

                        return withFunctions(useKey);
                    } else {
                        switch (isAlias.type) {
                            case that._linkMarks.parents: {
                                var aliasResolve = null;

                                for (var i = parentptrs.length - 2; i >= -1; i--) {
                                    aliasResolve = that.__resolve({
                                        key: useKey,
                                        dataroot: parentptrs[i],
                                        setNewValue: setNewValue,
                                        mustMatchFirstKey: true,
                                        _expandStringParams: expandStringParams,
                                    });
                                    if (aliasResolve.found) {
                                        return withFunctions(aliasResolve.value);
                                    }
                                }
                                break;
                            }
                            case that._linkMarks.siblings:
                            case that._linkMarks.root: {
                                var useLinkKey;

                                if (isAlias.type === that._linkMarks.siblings) {
                                    var pathProps = key.split(that._keysSplit);

                                    if (pathProps.length >= 2) {
                                        pathProps.splice(pathProps.length - 1, 1, isAlias.key);
                                        useLinkKey = pathProps.join(that._keysSplit);
                                    } else {
                                        useLinkKey = useKey;
                                    }
                                } else {
                                    useLinkKey = useKey;
                                }

                                var aliasResolve = that.__resolve({
                                    key: useLinkKey, 
                                    _expandStringParams: expandStringParams,
                                });

                                if (aliasResolve.found) {
                                    return withFunctions(aliasResolve.value);
                                }
                                break;
                            }
                        }
                    }

                    return '';
                });
            }
        }

        if (parsed.functions && typeof datacur === 'string') {
            datacur = that.__applyFunctions(datacur, parsed.functions);
        }

        return {
            found: !notFound,
            value: datacur,
        }
    }
}

module.exports = _dataAliases;
