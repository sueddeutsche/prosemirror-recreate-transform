import { strict as assert } from "assert";
import { recreateTransform } from "../src/recreate";


describe("mocha setup", () => {
    it("should import recreateTransform", () => assert.equal(typeof recreateTransform, "function"));
});
