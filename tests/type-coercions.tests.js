
const {expect} = require("chai");
const {createScope, compileTypeCoercers, core: c} = require("../lib");

describe("type coercions", () => {

  it("should work for the most basic case", () => {

    const scope = createScope();

    scope.newType("A", c.strictStruct({
      foo: c.string()
    }));

    const b = scope.newType("B", c.strictStruct({
      bar: c.string()
    }));

    scope.newType("C", c.strictStruct({
      baz: b
    }));

    const data = {
      baz: {
        foo: "blah"
      }
    };

    const aToBCoercion = (x) => ({
      bar: x.foo
    });

    scope.newTypeConverter("A", "B", aToBCoercion);

    const coerce = compileTypeCoercers(scope);

    const converted = coerce.C(data);

    expect(converted).to.deep.equal({
      baz: {
        bar: "blah"
      }
    });
  });

  it("should work when the outermost type needs a conversion", () => {

    const scope = createScope();

    scope.newType("A", c.strictStruct({
      foo: c.string()
    }));

    const b = scope.newType("B", c.strictStruct({
      bar: c.string()
    }));

    const data = {
      foo: "blah"
    };

    const aToBCoercion = (x) => ({
      bar: x.foo
    });

    scope.newTypeConverter("A", "B", aToBCoercion);

    const coerce = compileTypeCoercers(scope);

    const converted = coerce.B(data);

    expect(converted).to.deep.equal({
      bar: "blah"
    });
  });

  it("should follow a chain of conversions", () => {

    const scope = createScope();

    scope.newType("A", c.strictStruct({
      foo: c.string()
    }));

    const b = scope.newType("B", c.strictStruct({
      bar: c.string()
    }));

    scope.newType("C", c.strictStruct({
      baz: c.string()
    }));

    const data = {
      foo: "blah"
    };

    const aToBCoercion = (x) => ({
      bar: x.foo
    });

    const bToCCoercion = (x) => ({
      baz: x.bar
    });

    scope.newTypeConverter("A", "B", aToBCoercion);

    scope.newTypeConverter("B", "C", bToCCoercion);

    const coerce = compileTypeCoercers(scope);

    const converted = coerce.C(data);

    expect(converted).to.deep.equal({
      baz: "blah"
    });
  });

  it("should handle a nested case", () => {

    const scope = createScope();

    const a = scope.newType("innerSource", c.strictStruct({
      sourceInnerField: c.string()
    }));

    scope.newType("outerSource", c.strictStruct({
      sourceOuterField: a
    }));

    const d = scope.newType("innerTarget", c.strictStruct({
      targetInnerField: c.string()
    }));

    scope.newType("outerTarget", c.strictStruct({
      targetOuterField: d
    }));

    const innerConversion = x => ({
      targetInnerField: x.sourceInnerField
    });

    const outerConversion = x => ({
      targetOuterField: x.sourceOuterField
    });

    const data = {
      sourceOuterField: {
        sourceInnerField: "blah"
      }
    };

    scope.newTypeConverter("innerSource", "innerTarget", innerConversion);
    scope.newTypeConverter("outerSource", "outerTarget", outerConversion);

    const coerce = compileTypeCoercers(scope);

    const converted = coerce.outerTarget(data);

    expect(converted).to.deep.equal({
      targetOuterField: {
        targetInnerField: "blah"
      }
    });
  });

  it("should follow a chain of conversions with dead-ends", () => {
    const scope = createScope();

    scope.newType("sourceType", c.strictStruct({
      field: c.string()
    }));

    scope.newType("deadEnd1", c.strictStruct({
      badField: c.string()
    }));

    scope.newType("correctStep1", c.strictStruct({
      stepField: c.string()
    }));

    scope.newType("deadEnd2", c.strictStruct({
      anotherBadField: c.string()
    }));

    scope.newType("deadEnd3", c.strictStruct({
      badField3: c.string()
    }));

    scope.newType("targetType", c.strictStruct({
      target: c.string()
    }));

    scope.newType("deadEnd4", c.strictStruct({
      badField4: c.string()
    }));

    scope.newType("deadEnd5", c.strictStruct({
      badField5: c.string()
    }));

    scope.newTypeConverter("sourceType", "deadEnd1", x => ({
      badField: x.field
    }));

    scope.newTypeConverter("sourceType", "correctStep1", x => ({
      stepField: x.field
    }));

    scope.newTypeConverter("sourceType", "deadEnd2", x => ({
      anotherBadField: x.field
    }));

    scope.newTypeConverter("correctStep1", "deadEnd3", x => ({
      badField3: x.stepField
    }));

    scope.newTypeConverter("correctStep1", "targetType", x => ({
      target: x.stepField
    }));

    scope.newTypeConverter("correctStep1", "deadEnd4", x => ({
      badField4: x.stepField
    }));

    scope.newTypeConverter("deadEnd4", "deadEnd5", x => ({
      badField5: x.badField4
    }));

    const coerce = compileTypeCoercers(scope);

    const converted = coerce.targetType({
      field: "foo"
    });

    expect(converted).to.deep.equal({
      target: "foo"
    });
  });

  it.skip("should let you convert keys and values in dictionaries", () => {
  });

  it.skip("should let you convert the contents of lists", () => {
  });

  it.skip("should let you convert fields inside lax structs", () => {
  });

  it.skip("should convert items in an alternatives field", () => {
  });

  it.skip("should not convert an alternative if a match is possible later in the alternatives", () => {
  });

  it.skip("should be able to convert one enum to another", () => {
  });

  it.skip("should be able to convert an enum to a string or a string to an enum", () => {
  });

  it.skip("should be able to convert a self-referential recursive structure to another recursive structure", () => {
  });

  it.skip("should let you convert a custom type to a built-in type and vice versa", () => {
  });

  it.skip("should let you convert one custom type to another", () => {
  });

  it.skip("should handle the composition of dictionaries, structs, and arrays in a complex case", () => {
  });

  it("should let you convert primitive types", () => {
    const scope = createScope();

    scope.newType("myString", c.string());
    scope.newType("myNumber", c.number());

    scope.newTypeConverter("myString", "myNumber", x => x.length);

    const coerce = compileTypeCoercers(scope);

    expect(coerce.myNumber("foo")).to.equal(3);
  });

  it.skip("should let you convert an optional field", () => {
  });

  it.skip("should not convert an optional field if the convertable value is null", () => {
  });

});
