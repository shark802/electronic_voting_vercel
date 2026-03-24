import { pool } from "../config/database";
import { selectQuery } from "../data_access/query";
import { RegisterFaces } from "./types/RegisterFaces";

export async function hasUserRegisterFaceImage(idNumber: string) {
    const [faceImageRow] = await selectQuery<RegisterFaces>(pool, 'SELECT * FROM register_faces WHERE id_number = ? AND deleted_at IS NULL LIMIT 1', [idNumber]);
    const hasRegistered = faceImageRow !== undefined ? true : false;

    return hasRegistered;
}