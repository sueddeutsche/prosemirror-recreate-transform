import { strict as assert } from "assert";
import { recreateTransform } from "../src/recreateTransform";


describe("mocha setup", () => {
    it("should import recreateTransform", () => assert.equal(typeof recreateTransform, "function"));
});
