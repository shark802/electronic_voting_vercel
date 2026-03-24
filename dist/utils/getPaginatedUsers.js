"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginatedUsers = void 0;
function getPaginatedUsers(users, page, pageSize = 30) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return users.slice(startIndex, endIndex);
}
exports.getPaginatedUsers = getPaginatedUsers;
