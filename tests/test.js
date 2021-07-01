var test = require('tape')
var Aliases = global.Aliases;
var defaultValue = '<DEFAULT>';
var data = {
    nested: {
        obj: {
            arr: [
                'one',
                'two',
                {
                    prop: 'Prop'
                }
            ]
        }
    },
    testing: {
        arr: [
            1, 22, 333
        ],
        obj: {
            bar: 'Foo'
        }
    },
    aliases: {
        root: '@nested.obj.arr.1',
        nested: {
            props: {
                one: 1,
                two: 22,
                three: 333,
                nested: {
                    props: {
                        foo: 'Bar'
                    },
                    parentsAlias: '~testing.obj.bar'
                },
                siblingAlias: '>two',
                siblingAliasFoo: '>nested.props.foo'
            }
        }
    },
    some: {
        param: 'Own some param!',
        param2: 'Own some param 2!',
        param3: 'Own some param 3!',
    },
    expandString: {
        types: {
            _string: 'String',
            _int: 'Integer',
            _float: 'Float'
        },
        test: 'This is a {>types._string}',
        rootTest: 'Root test {testing.obj.bar}',
        aliasTest: '>nested.formats.test.parent',
        aliasTestParams: 'Alias test {aliases.root|tickquote} and "{some.param|upper}" and "{@some.param}"',
        aliasSiblingTest: 'Alias sibling test {aliases.nested.props.siblingAliasFoo}',
        aliasParentsTest: 'Alias parents test {aliases.nested.props.nested.parentsAlias}',
        nested: {
            thisParents: {
                _str: 'Str',
                _int: 'Int',
                _flt: 'Flt'
            },
            formats: {
                test: {
                    parent: 'This is a parent test {~nested.thisParents._flt}'
                }
            }
        },
        lang: {
            arg1: 'Arg 1',
            message: 'The type is "{~#type}"',
            message2: 'The type is "{#type}"',
            message3: 'The type is "{#type|upper}"',
            message4: 'The type is {#type|lower,tickquote}',
        },
    },
    aliasLinksWithParams: {
        first: ['~expandString.lang.message4', { type: '~expandString.nested.thisParents._str' }],
        second: '~expandString.nested.thisParents._str',
        linkToFirst: '>first',
        linkToSecond: '>second',
    },
    rootAlias1: '>some.param',
    rootAlias2: '@some.param2',
    rootAlias3: '~some.param3',
    idx: {
        msg1: 'This is type of {0} !!',
        msg2: 'This is type of {0|upper} !!',
        msg3: 'This is type of {#0} !!',
        msg4: 'This is type of {#test} !!',
        args: [ 'Aa', 'Bb' ],
    },
};

function printData() {
    console.log(JSON.stringify(data, null, 2));
}

// var dataAliases2 = new Aliases(data);

// console.log(dataAliases2.expandString('expandString.test'));
// console.log(dataAliases2.expandString('expandString.rootTest'));
// console.log(dataAliases2.expandString('expandString.aliasTestParams', {
//     some: {
//         param: 'Some Param!'
//     }
// }));
// console.log(dataAliases2.expandString('expandString.aliasSiblingTest'));
// console.log(dataAliases2.expandString('expandString.aliasParentsTest'));

// return;

test('expand string', function(t) {
    var dataAliases = new Aliases(data);

    dataAliases.setCustomPipes({
        tickquote(value) {
            return `\`${value}\``;
        }
    });

    t.equal(dataAliases.expandString('expandString.test'), 'This is a String');
    t.equal(dataAliases.expandString('expandString.rootTest'), 'Root test Foo');
    t.equal(dataAliases.expandString('expandString.aliasTest'), 'This is a parent test Flt');
    t.equal(dataAliases.expandString('expandString.aliasTestParams', {
        some: {
            param: 'Some Param!'
        }
    }), 'Alias test `two` and "SOME PARAM!" and "Own some param!"');
    t.equal(dataAliases.expandString('expandString.lang.message', {
        type: 'nested.thisParents._int'
    }), 'The type is "Int"');
    t.equal(dataAliases.expandString('expandString.lang.message2', {
        type: '>arg1'
    }), 'The type is "Arg 1"');
    t.equal(dataAliases.expandString('expandString.lang.message2', {
        type: '~nested.obj.arr.0'
    }), 'The type is "one"');
    t.equal(dataAliases.expandString('expandString.lang.message2', {
        type: '~nested.thisParents._str'
    }), 'The type is "Str"');
    t.equal(dataAliases.expandString('expandString.lang.message3', {
        type: 'expandString.types._float'
    }), 'The type is "FLOAT"');
    t.equal(dataAliases.expandString('expandString.lang.message2', {
        type: 'My Custom Test'
    }), 'The type is "My Custom Test"');
    t.equal(dataAliases.expandString('expandString.lang.message3', {
        type: 'My Custom Test'
    }), 'The type is "MY CUSTOM TEST"');
    t.equal(dataAliases.expandString('expandString.lang.message4', {
        type: 'Lower with Ticks'
    }), 'The type is `lower with ticks`');
    t.equal(dataAliases.expandString('expandString.aliasSiblingTest'), 'Alias sibling test Bar');
    t.equal(dataAliases.expandString('expandString.aliasParentsTest'), 'Alias parents test Foo');

    t.equal(dataAliases.expandString('rootAlias1'), 'Own some param!');
    t.equal(dataAliases.expandString('rootAlias2'), 'Own some param 2!');
    t.equal(dataAliases.expandString('rootAlias3'), 'Own some param 3!');

    t.equal(dataAliases.expandString('aliasLinksWithParams.first'), 'The type is `str`');
    t.equal(dataAliases.expandString('aliasLinksWithParams.linkToFirst'), 'The type is `str`');

    t.equal(dataAliases.expandString('aliasLinksWithParams.linkToSecond'), 'Str');

    t.equal(dataAliases.expandString('idx.msg1', ['Testing']), 'This is type of Testing !!');
    t.equal(dataAliases.expandString('idx.msg2', ['Testing|lower']), 'This is type of TESTING|LOWER !!');
    t.equal(dataAliases.expandString('idx.msg3', ['Testing']), 'This is type of Testing !!');
    t.equal(dataAliases.expandString('idx.msg3', ['>args.0|lower']), 'This is type of aa !!');
    t.equal(dataAliases.expandString('idx.msg4', { test: 'Testing' }), 'This is type of Testing !!');

    t.end();
});

test('get/set/del/has/exists value', function (t) {
    var dataAliases = new Aliases(data);

    t.assert(dataAliases.has('nested.obj.arr.2.prop'));
    t.assert(dataAliases.exists('nested.obj.arr.2.prop'));

    t.equal(dataAliases.get('nested.obj.arr.-1.prop'), 'Prop');
    t.equal(dataAliases.get('nested.obj.arr.-2'), 'two');
    t.equal(dataAliases.get('nested.obj.arr.-3'), 'one');
    t.equal(dataAliases.get('nested.obj.arr.2.prop'), 'Prop');

    dataAliases.set('nested.obj.arr.2.prop', 'New Prop');
    t.equal(dataAliases.get('nested.obj.arr.2.prop'), 'New Prop');
    t.equal(data.nested.obj.arr[2].prop, 'New Prop');

    dataAliases.del('nested.obj.arr.2.prop');
    t.assert(!dataAliases.has('nested.obj.arr.2.prop'));
    t.assert(!dataAliases.exists('nested.obj.arr.2.prop'));
    t.assert(typeof(data.nested.obj.arr[2].prop) != undefined);
    t.equal(dataAliases.get('nested.obj.arr.2.prop', defaultValue), defaultValue);

    t.end();
});

test('get/set/del root aliases', function (t) {
    var dataAliases = new Aliases(data);

    t.assert(dataAliases.has('aliases.root'));
    t.assert(dataAliases.exists('aliases.root'));
    t.equal(dataAliases.get('aliases.root'), 'two');
    t.equal(dataAliases.$get('aliases.root'), '@nested.obj.arr.1');

    dataAliases.set('aliases.root', 'New two');
    t.equal(dataAliases.get('aliases.root'), 'New two');
    t.equal(data.nested.obj.arr[1], 'New two');

    dataAliases.del('aliases.root');
    t.assert(!dataAliases.has('aliases.root'));
    t.assert(dataAliases.exists('aliases.root'));
    t.assert(data.nested.obj.arr.length != 2);
    t.equal(data.aliases.root, '@nested.obj.arr.1');

    t.end();
});

test('get/set/del sibling aliases', function (t) {
    var dataAliases = new Aliases(data);

    t.assert(dataAliases.has('aliases.nested.props.siblingAlias'));
    t.assert(dataAliases.exists('aliases.nested.props.siblingAlias'));
    t.equal(dataAliases.get('aliases.nested.props.siblingAlias'), 22);

    dataAliases.set('aliases.nested.props.siblingAlias', 222);
    t.equal(dataAliases.get('aliases.nested.props.siblingAlias'), 222);
    t.equal(dataAliases.get('aliases.nested.props.two'), 222);
    t.equal(data.aliases.nested.props.two, 222);

    dataAliases.del('aliases.nested.props.siblingAlias');
    t.assert(!dataAliases.has('aliases.nested.props.siblingAlias'));
    t.assert(dataAliases.exists('aliases.nested.props.siblingAlias'));
    t.assert(typeof(data.aliases.nested.props.two) != undefined);
    t.equal(dataAliases.get('aliases.nested.props.siblingAlias', defaultValue), defaultValue);
    t.equal(data.aliases.nested.props.siblingAlias, '>two');

    t.assert(dataAliases.has('aliases.nested.props.siblingAliasFoo'));
    t.assert(dataAliases.exists('aliases.nested.props.siblingAliasFoo'));
    t.equal(dataAliases.get('aliases.nested.props.siblingAliasFoo'), 'Bar');

    dataAliases.set('aliases.nested.props.siblingAliasFoo', 'New Bar');
    t.equal(dataAliases.get('aliases.nested.props.siblingAliasFoo'), 'New Bar');
    t.equal(dataAliases.get('aliases.nested.props.nested.props.foo'), 'New Bar');
    t.equal(data.aliases.nested.props.nested.props.foo, 'New Bar');

    dataAliases.del('aliases.nested.props.siblingAliasFoo');
    t.assert(!dataAliases.has('aliases.nested.props.siblingAliasFoo'));
    t.assert(dataAliases.exists('aliases.nested.props.siblingAliasFoo'));
    t.assert(typeof(data.aliases.nested.props.nested.props.foo) != undefined);
    t.equal(dataAliases.get('aliases.nested.props.siblingAliasFoo', defaultValue), defaultValue);
    t.equal(data.aliases.nested.props.siblingAliasFoo, '>nested.props.foo');

    t.end();
});

test('get/set/del parent aliases', function (t) {

    var dataAliases = new Aliases(data);

    t.assert(dataAliases.has('aliases.nested.props.nested.parentsAlias'));
    t.assert(dataAliases.exists('aliases.nested.props.nested.parentsAlias'));
    t.equal(dataAliases.get('aliases.nested.props.nested.parentsAlias'), 'Foo');

    dataAliases.set('aliases.nested.props.nested.parentsAlias', 'Parent Foo');

    // printData();
    // t.end();
    // return;

    t.equal(dataAliases.get('aliases.nested.props.nested.parentsAlias'), 'Parent Foo');
    t.equal(data.testing.obj.bar, 'Parent Foo');

    dataAliases.del('aliases.nested.props.nested.parentsAlias');
    t.equal(dataAliases.get('aliases.nested.props.nested.parentsAlias', defaultValue), defaultValue);
    t.assert(!('bar' in data.testing.obj));

    t.end();
});

test('new array/object set values', function (t) {

    var dataAliases = new Aliases(data);

    dataAliases.set('nested.obj.testobj.nested.prop', 'New nested prop');
    t.equal(dataAliases.get('nested.obj.testobj.nested.prop'), 'New nested prop');

    dataAliases.set('nested.obj.arr.[]', 'test array push');
    t.equal(dataAliases.get('nested.obj.arr.-1'), 'test array push');

    dataAliases.set('nested.obj.arr.[].newobj.prop', 'New Prop in array push');
    t.equal(dataAliases.get('nested.obj.arr.-1.newobj.prop'), 'New Prop in array push');

    dataAliases.set('nested.obj.arr.0.change.prop', 'Change from string value to nested object');
    t.equal(dataAliases.get('nested.obj.arr.0.change.prop'), 'Change from string value to nested object');

    dataAliases.set('rootprop', 'Root prop string');
    t.equal(dataAliases.get('rootprop'), 'Root prop string');

    t.end();
});

test('$get/$set/$del props', function (t) {
    var dataAliases = new Aliases(data);

    t.assert(dataAliases.$has('aliases.root'));
    t.assert(!dataAliases.$has('notExists'));
    t.equal(dataAliases.$get('aliases.root'), '@nested.obj.arr.1');

    dataAliases.set('testing.obj.bar', 'Alias Foo');
    dataAliases.$set('aliases.root', '@testing.obj.bar');
    t.equal(dataAliases.$get('aliases.root'), '@testing.obj.bar');
    t.equal(data.aliases.root, '@testing.obj.bar');
    t.equal(dataAliases.get('aliases.root'), 'Alias Foo');

    dataAliases.$del('aliases.root');
    t.assert(!dataAliases.has('aliases.root'));
    t.assert(!dataAliases.exists('aliases.root'));
    t.assert(!('root' in data.aliases));

    t.end();
});

test('merge', function (t) {
    var dataAliases = new Aliases(data);

    const util = require('util');

    dataAliases.merge({
        nested: {
            obj: {
                arr: ['some', 1, { arrExt: 'Array extend' }],
                newVal: 'New obj value',
                newNum: 123,
            },
            newArr: [1, 3, 5],
        },
        testing: {
            obj: {
                foo: 'Bar'
            },
        },
        newRootProp: {
            newOne: 1,
            newStr: 'String!',
            newObj: { oneObj: 'One object' },
            newArr: [1, 'two', 3, 'four'],
        },
    });

    // printData();

    t.equal(dataAliases.get('nested.obj.arr.-1.arrExt'), 'Array extend');
    t.equal(dataAliases.get('nested.obj.arr.-2'), 1);
    t.equal(dataAliases.get('nested.obj.arr.-3'), 'some');
    t.deepEqual(dataAliases.get('nested.newArr'), [1, 3, 5]);
    t.equal(dataAliases.get('testing.obj.foo'), 'Bar');
    t.equal(dataAliases.get('newRootProp.newOne'), 1);
    t.equal(dataAliases.get('newRootProp.newStr'), 'String!');
    t.equal(dataAliases.get('newRootProp.newObj.oneObj'), 'One object');

    t.equal(dataAliases.get('newRootProp.newArr.0'), 1);
    t.equal(dataAliases.get('newRootProp.newArr.1'), 'two');
    t.equal(dataAliases.get('newRootProp.newArr.2'), 3);
    t.equal(dataAliases.get('newRootProp.newArr.3'), 'four');

    t.end();
});
