import { Request, Response, NextFunction } from "express";
import { insertQuery, selectQuery, updateQuery } from "../../data_access/query";
import { pool } from "../../config/database";
import { IpAddress } from "../../utils/types/IpAddress";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/customErrors";

export async function addIpAddress(req: Request, res: Response, next: NextFunction) {
    try {
        const ipAddress = req.body.ipAddress;
        const networkName = req.body.networkName;

        if (!ipAddress || !networkName) throw new Error('Ip address and network name are required');

        const existingIpAddress = await selectQuery<IpAddress>(pool, 'SELECT * FROM ip_address WHERE ip_address = ? AND deleted_at IS NULL LIMIT 1', [(ipAddress as string).trim()]);
        if (existingIpAddress.length > 0) throw new ConflictError(`${ipAddress} already exist`);

        const insertedIpAddress = await insertQuery(pool, 'INSERT INTO ip_address (network_name, ip_address) VALUES (?, ?)', [String(networkName).trim(), String(ipAddress).trim()]);
        if (insertedIpAddress.affectedRows === 0) {
            throw new Error('Failed to insert ip address');
        }

        return res.status(200).json({ message: 'Ip address added successfully' });

    } catch (error) {
        next(error);
    }
}

export async function getIpAddress(req: Request, res: Response, next: NextFunction) {
    try {
        const ipAddress = req.query.ipAddress;

        if (!ipAddress) return res.status(200);

        const [ipAddressResult] = await selectQuery<IpAddress>(pool, 'SELECT * FROM ip_address WHERE ip_address = ? AND deleted_at IS NULL LIMIT 1', [(ipAddress as string).trim()]);

        if (!ipAddressResult) {
            return res.status(200).json({ message: `${ipAddress} is not registered` });
        }

        return res.status(200).json({ ip_address: ipAddressResult.ip_address, isValid: true });

    } catch (error) {
        next(error);
    }
}

export async function removeIpAddress(req: Request, res: Response, next: NextFunction) {
    try {
        const ipAddress = req.body.ipAddress;

        if (!ipAddress) throw new Error('Ip address is required');

        const [ipAddressResult] = await selectQuery<IpAddress>(pool, 'SELECT * FROM ip_address WHERE ip_address = ? AND deleted_at IS NULL LIMIT 1', [ipAddress]);
        if (!ipAddressResult) throw new NotFoundError(`${ipAddress} not found`);

        const deletedIpAddress = await updateQuery(pool, 'UPDATE ip_address SET deleted_at = ? WHERE ip_address = ?', [new Date(), ipAddress]);
        if (deletedIpAddress.affectedRows === 0) throw new Error('Failed to delete ip address');

        return res.status(200).json({ message: `${ipAddress} deleted successfully` });

    } catch (error) {
        next(error);
    }
}

export async function getAllIpAddress(req: Request, res: Response, next: NextFunction) {
    try {
        const ipAddress = await selectQuery<IpAddress>(pool, 'SELECT * FROM ip_address WHERE deleted_at IS NULL');
        return res.status(200).json({ ipAddress });
    } catch (error) {
        next(error);
    }
}

export async function validateIpAddress(req: Request, res: Response, next: NextFunction) {
    try {
        const ipAddress = req.body.ipAddress;
        if (!ipAddress) throw new BadRequestError('IP Address is undefined');

        const [ipAddressResult] = await selectQuery<IpAddress>(pool, 'SELECT * FROM ip_address WHERE ip_address = ? AND deleted_at IS NULL LIMIT 1', [(ipAddress as string).trim()]);

        const isIpRegistered = ipAddressResult ? true : false;
        req.session.ipRegistered = isIpRegistered;

        return res.status(200).json({ isValid: isIpRegistered });
    } catch (error) {
        next(error)
    }
}


