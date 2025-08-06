"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModule = void 0;
class BaseModule {
    constructor(program, connection, wallet) {
        this.program = program;
        this.connection = connection;
        this.wallet = wallet;
    }
}
exports.BaseModule = BaseModule;
